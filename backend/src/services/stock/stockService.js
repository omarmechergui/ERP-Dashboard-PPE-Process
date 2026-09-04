/**
 * Central Stock Service
 *
 * ALL physical stock mutations (Article.quantite, StockLocation.quantite,
 * MouvementStock creation) MUST go through this service.
 *
 * Every method receives a Prisma transaction client (`tx`) — the caller
 * is responsible for opening and committing/rolling back the transaction.
 * This ensures the stock mutation is part of a larger atomic operation
 * (e.g. commande receiving + marking commande as RECEIVED).
 *
 * Design rules:
 * - Never use Math.max(0, ...) to silently floor stock.
 * - Throw InsufficientStockError when stock is not enough.
 * - Always create MouvementStock alongside the mutation.
 * - Always update StockLocation alongside Article.quantite.
 */

const { allocateFromLocations } = require('./stockAllocationService');
const {
  InsufficientStockError,
  InvalidStockOperationError,
  InvalidStockLocationError,
} = require('./stockErrors');

// ──────────────────────────────────────────────
// STOCK ENTRY (ENTREE)
// ──────────────────────────────────────────────

/**
 * Receive stock into a specific location.
 *
 * Updates: Article.quantite (+), StockLocation (+), MouvementStock (ENTREE).
 *
 * @param {import('@prisma/client').PrismaClient} tx - Prisma transaction client
 * @param {object} params
 * @param {string} params.articleId - Article ID
 * @param {string} params.locationName - Location/emplacement name
 * @param {number} params.quantity - Quantity to receive (must be > 0)
 * @param {string} [params.poReference] - Purchase order reference
 * @param {number} [params.planificationId] - Related planification
 * @param {boolean} [params.etat=true] - Reception state
 * @param {string} [params.matricule] - Operator matricule
 * @returns {Promise<object>} The created MouvementStock record
 */
async function receiveStock(tx, {
  articleId,
  locationName,
  quantity,
  poReference = null,
  planificationId = null,
  etat = true,
  matricule = null,
}) {
  if (!quantity || quantity <= 0 || !Number.isFinite(quantity)) {
    throw new InvalidStockOperationError(
      `Quantité d'entrée invalide: ${quantity}`,
      { articleId, quantity }
    );
  }

  // Read current article inside the transaction
  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article) {
    throw new InvalidStockOperationError(
      `Article ${articleId} introuvable`,
      { articleId }
    );
  }

  let newArticleQty = article.quantite;

  // Only increment stock when etat is true (actually received)
  if (etat) {
    newArticleQty = article.quantite + quantity;

    // Update article global quantity
    await tx.article.update({
      where: { id: articleId },
      data: { quantite: newArticleQty },
    });

    // Upsert stock location
    await tx.stockLocation.upsert({
      where: {
        articleId_location: {
          articleId,
          location: locationName,
        },
      },
      update: {
        quantite: { increment: quantity },
      },
      create: {
        articleId,
        location: locationName,
        quantite: quantity,
      },
    });
  }

  // Create movement record
  const movement = await tx.mouvementStock.create({
    data: {
      type: 'ENTREE',
      po_reference: poReference,
      planification_id: planificationId,
      article_id: articleId,
      emplacement: locationName,
      quantite: quantity,
      etat,
      matricule,
      reste: newArticleQty,
    },
    include: { article: { select: { nom_article: true } } },
  });

  return movement;
}

// ──────────────────────────────────────────────
// STOCK EXIT — SINGLE LOCATION (SORTIE)
// ──────────────────────────────────────────────

/**
 * Issue stock from a specific location.
 *
 * Updates: Article.quantite (-), StockLocation (-), MouvementStock (SORTIE).
 *
 * @param {import('@prisma/client').PrismaClient} tx - Prisma transaction client
 * @param {object} params
 * @param {string} params.articleId
 * @param {string} params.locationName - The specific location to deduct from
 * @param {number} params.quantity - Quantity to issue (must be > 0)
 * @param {string} [params.matricule] - Operator matricule
 * @returns {Promise<object>} The created MouvementStock record
 * @throws {InsufficientStockError} if location or article doesn't have enough stock
 */
async function issueStock(tx, { articleId, locationName, quantity, matricule = null }) {
  if (!quantity || quantity <= 0 || !Number.isFinite(quantity)) {
    throw new InvalidStockOperationError(
      `Quantité de sortie invalide: ${quantity}`,
      { articleId, quantity }
    );
  }

  // Read article inside the transaction
  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article) {
    throw new InvalidStockOperationError(
      `Article ${articleId} introuvable`,
      { articleId }
    );
  }

  // Check article-level stock
  if (article.quantite < quantity) {
    throw new InsufficientStockError(articleId, quantity, article.quantite);
  }

  // Check location-level stock
  const stockLoc = await tx.stockLocation.findUnique({
    where: {
      articleId_location: {
        articleId,
        location: locationName,
      },
    },
  });

  if (!stockLoc) {
    throw new InvalidStockLocationError(articleId, locationName);
  }

  if (stockLoc.quantite < quantity) {
    throw new InsufficientStockError(articleId, quantity, stockLoc.quantite, locationName);
  }

  const newArticleQty = article.quantite - quantity;

  // Update article
  await tx.article.update({
    where: { id: articleId },
    data: { quantite: newArticleQty },
  });

  // Update location
  await tx.stockLocation.update({
    where: { id: stockLoc.id },
    data: { quantite: stockLoc.quantite - quantity },
  });

  // Create movement
  const movement = await tx.mouvementStock.create({
    data: {
      type: 'SORTIE',
      article_id: articleId,
      emplacement: locationName,
      quantite: quantity,
      matricule,
      reste: newArticleQty,
    },
    include: { article: { select: { nom_article: true } } },
  });

  return movement;
}

// ──────────────────────────────────────────────
// STOCK EXIT — MULTI-LOCATION (SORTIE)
// ──────────────────────────────────────────────

/**
 * Issue stock across multiple locations using the allocation strategy.
 *
 * Uses allocateFromLocations (descending quantity order) to determine
 * which locations to deduct from. Creates one MouvementStock per location touched.
 *
 * @param {import('@prisma/client').PrismaClient} tx
 * @param {object} params
 * @param {string} params.articleId
 * @param {number} params.quantity - Total quantity to issue
 * @param {string} [params.matricule]
 * @returns {Promise<{movements: object[], newArticleQty: number}>}
 * @throws {InsufficientStockError} if combined locations don't have enough
 */
async function issueStockMultiLocation(tx, { articleId, quantity, matricule = null }) {
  if (!quantity || quantity <= 0 || !Number.isFinite(quantity)) {
    throw new InvalidStockOperationError(
      `Quantité de sortie invalide: ${quantity}`,
      { articleId, quantity }
    );
  }

  // Read article inside the transaction
  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article) {
    throw new InvalidStockOperationError(
      `Article ${articleId} introuvable`,
      { articleId }
    );
  }

  // Check article-level stock first
  if (article.quantite < quantity) {
    throw new InsufficientStockError(articleId, quantity, article.quantite);
  }

  // Allocate across locations
  const allocations = await allocateFromLocations(tx, articleId, quantity);

  const newArticleQty = article.quantite - quantity;

  // Update article total
  await tx.article.update({
    where: { id: articleId },
    data: { quantite: newArticleQty },
  });

  // Apply per-location deductions and create movements
  const movements = [];
  let runningQty = article.quantite;

  for (const alloc of allocations) {
    await tx.stockLocation.update({
      where: { id: alloc.locationId },
      data: { quantite: { decrement: alloc.deduction } },
    });

    runningQty -= alloc.deduction;

    const movement = await tx.mouvementStock.create({
      data: {
        type: 'SORTIE',
        article_id: articleId,
        emplacement: alloc.location,
        quantite: alloc.deduction,
        matricule,
        reste: runningQty,
      },
    });
    movements.push(movement);
  }

  return { movements, newArticleQty };
}

// ──────────────────────────────────────────────
// RESERVATION MANAGEMENT
// ──────────────────────────────────────────────

/**
 * Allocate (reserve) stock for an article.
 * Increments Article.reserved_qty after checking available stock.
 *
 * @param {import('@prisma/client').PrismaClient} tx
 * @param {object} params
 * @param {string} params.articleId
 * @param {number} params.quantity
 * @returns {Promise<object>} Updated article
 * @throws {InsufficientStockError} if available (quantite - reserved_qty) < quantity
 */
async function allocateReservation(tx, { articleId, quantity }) {
  if (!quantity || quantity <= 0 || !Number.isFinite(quantity)) {
    throw new InvalidStockOperationError(
      `Quantité de réservation invalide: ${quantity}`,
      { articleId, quantity }
    );
  }

  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article) {
    throw new InvalidStockOperationError(
      `Article ${articleId} introuvable`,
      { articleId }
    );
  }

  const availableStock = article.quantite - article.reserved_qty;
  if (availableStock < quantity) {
    throw new InsufficientStockError(articleId, quantity, availableStock);
  }

  const updated = await tx.article.update({
    where: { id: articleId },
    data: { reserved_qty: { increment: quantity } },
  });

  return updated;
}

/**
 * Release a reservation (decrement reserved_qty).
 *
 * @param {import('@prisma/client').PrismaClient} tx
 * @param {object} params
 * @param {string} params.articleId
 * @param {number} params.quantity
 * @returns {Promise<object>} Updated article
 */
async function releaseReservation(tx, { articleId, quantity }) {
  if (!quantity || quantity <= 0 || !Number.isFinite(quantity)) {
    throw new InvalidStockOperationError(
      `Quantité de libération invalide: ${quantity}`,
      { articleId, quantity }
    );
  }

  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article) {
    throw new InvalidStockOperationError(
      `Article ${articleId} introuvable`,
      { articleId }
    );
  }

  if (article.reserved_qty < quantity) {
    throw new InvalidStockOperationError(
      `Quantité réservée insuffisante pour l'article ${articleId} (Réservé: ${article.reserved_qty}, Demandé: ${quantity})`,
      { articleId, reserved: article.reserved_qty, requested: quantity }
    );
  }

  const updated = await tx.article.update({
    where: { id: articleId },
    data: { reserved_qty: { decrement: quantity } },
  });

  return updated;
}

/**
 * Consume reserved stock: deduct physical stock AND reserved_qty,
 * allocate across locations, and create movement records.
 *
 * @param {import('@prisma/client').PrismaClient} tx
 * @param {object} params
 * @param {string} params.articleId
 * @param {number} params.quantity
 * @param {string} [params.matricule]
 * @returns {Promise<{movements: object[], newArticleQty: number}>}
 */
async function consumeReservedStock(tx, { articleId, quantity, matricule = null }) {
  if (!quantity || quantity <= 0 || !Number.isFinite(quantity)) {
    throw new InvalidStockOperationError(
      `Quantité de consommation invalide: ${quantity}`,
      { articleId, quantity }
    );
  }

  const article = await tx.article.findUnique({ where: { id: articleId } });
  if (!article) {
    throw new InvalidStockOperationError(
      `Article ${articleId} introuvable`,
      { articleId }
    );
  }

  // Validate reserved quantity
  if (article.reserved_qty < quantity) {
    throw new InvalidStockOperationError(
      `Quantité réservée invalide pour l'article ${articleId} (Réservé: ${article.reserved_qty}, Demandé: ${quantity})`,
      { articleId, reserved: article.reserved_qty, requested: quantity }
    );
  }

  // Validate physical stock
  if (article.quantite < quantity) {
    throw new InsufficientStockError(articleId, quantity, article.quantite);
  }

  // Allocate from locations (throws InsufficientStockError if not enough)
  const allocations = await allocateFromLocations(tx, articleId, quantity);

  const newArticleQty = article.quantite - quantity;

  // Update article: deduct both physical and reserved
  await tx.article.update({
    where: { id: articleId },
    data: {
      quantite: { decrement: quantity },
      reserved_qty: { decrement: quantity },
    },
  });

  // Apply per-location deductions and create movements
  const movements = [];
  let runningQty = article.quantite;

  for (const alloc of allocations) {
    await tx.stockLocation.update({
      where: { id: alloc.locationId },
      data: { quantite: { decrement: alloc.deduction } },
    });

    runningQty -= alloc.deduction;

    const movement = await tx.mouvementStock.create({
      data: {
        type: 'SORTIE',
        article_id: articleId,
        emplacement: alloc.location,
        quantite: alloc.deduction,
        matricule,
        reste: runningQty,
      },
    });
    movements.push(movement);
  }

  return { movements, newArticleQty };
}

// ──────────────────────────────────────────────
// BULK STOCK ENTRY (IMPORT-OPTIMIZED)
// ──────────────────────────────────────────────

/**
 * Receive stock for multiple articles in a single batch.
 * Optimized for bulk imports — replaces per-article receiveStock calls
 * with batched operations to minimize DB round-trips.
 *
 * @param {import('@prisma/client').PrismaClient} tx - Prisma transaction client
 * @param {Array<{articleId: string, locationName: string, quantity: number, poReference?: string, etat?: boolean, matricule?: string}>} operations
 * @returns {Promise<{movementCount: number}>}
 */
async function receiveStockBulk(tx, operations) {
  if (!operations || operations.length === 0) return { movementCount: 0 };

  // 1. Collect all unique article IDs we need to update
  const articleIds = [...new Set(operations.map(op => op.articleId))];

  // 2. Batch-read all articles in one query
  const articles = await tx.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, quantite: true },
  });
  const articleMap = new Map(articles.map(a => [a.id, a]));

  // 3. Pre-compute quantity increments per article
  const articleIncrements = new Map(); // articleId -> totalIncrement
  for (const op of operations) {
    if (op.etat !== false) {
      const prev = articleIncrements.get(op.articleId) || 0;
      articleIncrements.set(op.articleId, prev + op.quantity);
    }
  }

  // 4. Update each article's global quantity (parallel)
  const updatePromises = [];
  for (const [articleId, increment] of articleIncrements) {
    updatePromises.push(
      tx.article.update({
        where: { id: articleId },
        data: { quantite: { increment } },
      })
    );
  }
  await Promise.all(updatePromises);

  // 5. Upsert stock locations (parallel)
  const upsertPromises = [];
  for (const op of operations) {
    if (op.etat !== false) {
      upsertPromises.push(
        tx.stockLocation.upsert({
          where: {
            articleId_location: {
              articleId: op.articleId,
              location: op.locationName,
            },
          },
          update: { quantite: { increment: op.quantity } },
          create: {
            articleId: op.articleId,
            location: op.locationName,
            quantite: op.quantity,
          },
        })
      );
    }
  }
  await Promise.all(upsertPromises);

  // 6. Create all movement records in one createMany call
  const movementData = operations.map(op => {
    const article = articleMap.get(op.articleId);
    const totalIncrement = articleIncrements.get(op.articleId) || 0;
    const newQty = article ? article.quantite + totalIncrement : op.quantity;

    return {
      type: 'ENTREE',
      po_reference: op.poReference || null,
      article_id: op.articleId,
      emplacement: op.locationName,
      quantite: op.quantity,
      etat: op.etat !== false,
      matricule: op.matricule || null,
      reste: newQty,
    };
  });

  await tx.mouvementStock.createMany({ data: movementData });

  return { movementCount: movementData.length };
}

// ──────────────────────────────────────────────
// BULK STOCK EXIT (MULTI-LOCATION, MULTI-ARTICLE)
// ──────────────────────────────────────────────

/**
 * Issue stock for multiple articles across multiple locations in a single batch.
 *
 * @param {import('@prisma/client').PrismaClient} tx
 * @param {Array<{articleId: string, quantity: number, matricule?: string, panneauId?: string}>} operations
 * @returns {Promise<{movements: object[]}>}
 * @throws {InsufficientStockError} if any article has insufficient stock overall or across locations
 */
async function issueStockMultiLocationBulk(tx, operations) {
  if (!operations || operations.length === 0) return { movements: [] };

  // Aggregate requested quantities per article
  const aggregatedOps = {};
  for (const op of operations) {
    if (!op.quantity || op.quantity <= 0) {
      throw new InvalidStockOperationError(`Quantité invalide: ${op.quantity}`, op);
    }
    if (!aggregatedOps[op.articleId]) {
      aggregatedOps[op.articleId] = { quantity: 0, matricule: op.matricule, panneauId: op.panneauId };
    }
    aggregatedOps[op.articleId].quantity += op.quantity;
  }

  const articleIds = Object.keys(aggregatedOps);

  // 1. Batch-read all articles
  const articles = await tx.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, quantite: true },
  });
  const articleMap = new Map(articles.map(a => [a.id, a]));

  // Check article-level global stock
  for (const articleId of articleIds) {
    const requestedQty = aggregatedOps[articleId].quantity;
    const article = articleMap.get(articleId);
    if (!article) {
      throw new InvalidStockOperationError(`Article ${articleId} introuvable`);
    }
    if (article.quantite < requestedQty) {
      throw new InsufficientStockError(articleId, requestedQty, article.quantite);
    }
  }

  // 2. Batch-read all stock locations with quantite > 0
  const locations = await tx.stockLocation.findMany({
    where: {
      articleId: { in: articleIds },
      quantite: { gt: 0 },
    },
    orderBy: { quantite: 'desc' },
    select: { id: true, articleId: true, location: true, quantite: true },
  });

  const locationsByArticle = {};
  for (const loc of locations) {
    if (!locationsByArticle[loc.articleId]) {
      locationsByArticle[loc.articleId] = [];
    }
    locationsByArticle[loc.articleId].push(loc);
  }

  // 3. Compute allocations in memory and check sufficient stock per location
  const finalAllocations = [];
  const movementData = [];

  for (const articleId of articleIds) {
    let remaining = aggregatedOps[articleId].quantity;
    const articleLocs = locationsByArticle[articleId] || [];
    const opDetails = aggregatedOps[articleId];

    let runningGlobalQty = articleMap.get(articleId).quantite;

    await tx.article.update({
      where: { id: articleId },
      data: { quantite: { decrement: remaining } },
    });

    for (const loc of articleLocs) {
      if (remaining <= 0) break;
      const deduction = Math.min(loc.quantite, remaining);
      remaining -= deduction;
      runningGlobalQty -= deduction;

      await tx.stockLocation.update({
        where: { id: loc.id },
        data: { quantite: { decrement: deduction } },
      });

      movementData.push({
        type: 'SORTIE',
        article_id: articleId,
        emplacement: loc.location,
        quantite: deduction,
        matricule: opDetails.matricule || null,
        panneau_id: opDetails.panneauId || null,
        reste: runningGlobalQty,
      });
    }

    if (remaining > 0) {
      const totalAvailable = articleLocs.reduce((sum, l) => sum + l.quantite, 0);
      throw new InsufficientStockError(articleId, aggregatedOps[articleId].quantity, totalAvailable);
    }
  }

  // 4. Create all movements
  await tx.mouvementStock.createMany({ data: movementData });

  // Return the created movements by finding them
  // (createMany doesn't return the records, but for most cases we just need to know it succeeded)
  return { movements: movementData };
}

module.exports = {
  receiveStock,
  issueStock,
  issueStockMultiLocation,
  allocateReservation,
  releaseReservation,
  consumeReservedStock,
  receiveStockBulk,
  issueStockMultiLocationBulk,
};

