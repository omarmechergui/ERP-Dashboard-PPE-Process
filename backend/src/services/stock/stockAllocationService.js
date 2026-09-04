/**
 * Stock Allocation Service
 *
 * Responsible for determining HOW to distribute a stock issue
 * across multiple StockLocations for a given article.
 *
 * Strategy: Drain locations in descending quantity order
 * (largest-first). This matches the existing business logic
 * already present in reservationController.validateReservation.
 */

const { InsufficientStockError } = require('./stockErrors');

/**
 * Allocate a requested quantity across stock locations.
 *
 * @param {import('@prisma/client').PrismaClient} tx - Prisma transaction client
 * @param {string} articleId - The article to allocate from
 * @param {number} requestedQty - Total quantity to allocate
 * @returns {Promise<Array<{locationId: number, location: string, deduction: number}>>}
 *   Array of per-location deductions to apply.
 * @throws {InsufficientStockError} if locations don't have enough combined stock.
 */
async function allocateFromLocations(tx, articleId, requestedQty) {
  // Fetch locations ordered by quantity descending (drain largest first)
  const locations = await tx.stockLocation.findMany({
    where: {
      articleId,
      quantite: { gt: 0 },
    },
    orderBy: { quantite: 'desc' },
    select: {
      id: true,
      location: true,
      quantite: true,
    },
  });

  const allocations = [];
  let remaining = requestedQty;

  for (const loc of locations) {
    if (remaining <= 0) break;
    if (loc.quantite <= 0) continue;

    const deduction = Math.min(loc.quantite, remaining);
    remaining -= deduction;

    allocations.push({
      locationId: loc.id,
      location: loc.location,
      deduction,
    });
  }

  if (remaining > 0) {
    const totalAvailable = locations.reduce((sum, l) => sum + Math.max(0, l.quantite), 0);
    throw new InsufficientStockError(articleId, requestedQty, totalAvailable);
  }

  return allocations;
}

module.exports = { allocateFromLocations };
