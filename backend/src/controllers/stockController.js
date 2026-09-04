const { z } = require('zod');
const prisma = require('../config/db');
const { calculateEffectiveMinStock } = require('../helpers/stockHelpers');
const stockService = require('../services/stock/stockService');

const articleSchema = z.object({
  id: z.string().min(1, "L'ID de l'article est requis"),
  nom_article: z.string().min(1, "Le nom de l'article est requis"),
  prix: z.number().nonnegative("Le prix doit être positif ou zéro"),
  quantite: z.number().int().nonnegative().default(0),
  min_stock: z.number().int().nonnegative().default(100),
  address: z.string().optional().default(''),
  fournisseur_id: z.string().nullable().default(null),
});

const updateArticleSchema = z.object({
  nom_article: z.string().min(1).optional(),
  prix: z.number().nonnegative().optional(),
  quantite: z.number().int().nonnegative().optional(),
  min_stock: z.number().int().nonnegative().optional(),
  address: z.string().optional(),
  fournisseur_id: z.string().nullable().optional(),
});

const entreeSchema = z.object({
  po_reference: z.string().min(1, "La référence PO est requise"),
  planification_id: z.number().int().optional().nullable(),
  article_id: z.string().min(1, "L'ID de l'article est requis"),
  emplacement: z.string().min(1, "L'emplacement est requis"),
  quantite: z.number().int().positive("La quantité doit être supérieure à 0"),
  etat: z.boolean("L'état de réception (oui/non) est requis"),
});

const sortieSchema = z.object({
  article_id: z.string().min(1, "L'ID de l'article est requis"),
  quantite: z.number().int().positive("La quantité doit être supérieure à 0"),
  emplacement: z.string().min(1, "L'emplacement est requis"),
  matricule: z.string().min(1, "Le matricule de l'opérateur est requis"),
});

// @desc    Get all stock articles
// @route   GET /stock/articles
// @access  Private
const getArticles = async (req, res, next) => {
  try {
    const { low_stock, search, fournisseur_id, grouped, page, limit, availability } = req.query;

    // Fast-path optimization for Dashboard Critical Stock Panel
    if (low_stock === 'true' && !page && !limit && !search && !fournisseur_id) {
      const allArticles = await prisma.article.findMany({
        select: {
          id: true,
          nom_article: true,
          quantite: true,
          min_stock: true,
          bomLines: { select: { quantite: true } }
        }
      });
      const criticalStock = allArticles.filter(a => {
        const calculated_min_stock = calculateEffectiveMinStock(a.bomLines);
        const effective_min = calculated_min_stock > 0 ? calculated_min_stock : (a.min_stock || 10);
        const qty = Number(a.quantite ?? 0);
        return qty <= effective_min && qty > 0;
      }).map(a => {
        const { bomLines, ...rest } = a;
        const calculated_min_stock = calculateEffectiveMinStock(a.bomLines);
        const effective_min = calculated_min_stock > 0 ? calculated_min_stock : (a.min_stock || 10);
        return { ...rest, min_stock: effective_min };
      });
      return res.json(criticalStock);
    }

    const where = {};

    if (fournisseur_id) {
      where.fournisseur_id = fournisseur_id;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { nom_article: { contains: search, mode: 'insensitive' } },
      ];
    }

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const queryInclude = { 
      fournisseur: { select: { nom: true } },
      bomLines: { select: { quantite: true } },
      stockLocations: { select: { id: true, location: true, quantite: true } }
    };
    
    // Legacy mode backward compatibility
    if (!isPaginated) {
      queryInclude.reservationLignes = { select: { quantite: true } };
    }

    if (availability === 'out_of_stock') {
      where.quantite = { lte: 0 };
    } else if (availability === 'reserved') {
      where.reserved_qty = { gt: 0 };
    }

    let articlesData;
    let totalArticlesCount = 0;
    const isLowStockFilter = low_stock === 'true' || availability === 'low_stock';

    if (isPaginated && !isLowStockFilter) {
      const [fetchedArticles, count] = await Promise.all([
        prisma.article.findMany({
          where,
          include: queryInclude,
          orderBy: { id: 'asc' },
          skip,
          take: limitNum,
        }),
        prisma.article.count({ where })
      ]);
      articlesData = fetchedArticles;
      totalArticlesCount = count;
    } else {
      articlesData = await prisma.article.findMany({
        where,
        include: queryInclude,
        orderBy: { id: 'asc' },
      });
      totalArticlesCount = articlesData.length;
    }

    // Process and format articles
    const formattedArticles = [];
    
    articlesData.forEach(art => {
      const calculated_min_stock = calculateEffectiveMinStock(art.bomLines);
      const effective_min_stock = calculated_min_stock > 0 ? calculated_min_stock : (art.min_stock || 10);
      const { reservationLignes, bomLines, reserved_qty, stockLocations, ...rest } = art;
      
      const baseArticle = { ...rest, quantite_reservee: reserved_qty, min_stock: effective_min_stock };
      
      if (stockLocations && stockLocations.length > 0) {
        stockLocations.forEach(loc => {
          formattedArticles.push({
            ...baseArticle,
            uniqueId: `${baseArticle.id}_${loc.location}`,
            address: loc.location,
            quantite: loc.quantite, // Use location specific quantity
            total_global: baseArticle.quantite // Keep the global quantity if needed
          });
        });
      } else {
        formattedArticles.push({
          ...baseArticle,
          uniqueId: `${baseArticle.id}_${baseArticle.address || 'N/A'}`,
          total_global: baseArticle.quantite
        });
      }
    });

    let finalResult = formattedArticles;

    // Post-fetch filtering for low_stock (since it requires computing min_stock from BOM)
    if (isLowStockFilter) {
      finalResult = finalResult.filter(a => {
        const globalQty = Number(a.total_global ?? a.quantite ?? 0);
        const minStock = Number(a.min_stock ?? 10);
        return globalQty <= minStock && globalQty > 0;
      });
    }
    
    // Re-apply pagination if we fetched everything for JS filtering
    if (isPaginated && isLowStockFilter) {
      totalArticlesCount = finalResult.length;
      finalResult = finalResult.slice(skip, skip + limitNum);
    }

    // Backward compatibility for dashboard
    if (low_stock === 'true' && !isPaginated) {
      return res.json(finalResult);
    }

    if (grouped === 'true' && !isPaginated) {
      const groupedArticles = articlesData.map(art => {
        const calculated_min_stock = calculateEffectiveMinStock(art.bomLines);
        const { reservationLignes, bomLines, reserved_qty, ...rest } = art;
        return {
          ...rest,
          quantite_reservee: reserved_qty,
          min_stock: calculated_min_stock
        };
      });
      return res.json(groupedArticles);
    }

    if (isPaginated) {
      // Calculate Stats using aggregate for better performance
      const statsAgg = await prisma.article.aggregate({
        where, // apply same search/filters
        _sum: { quantite: true, reserved_qty: true },
        _count: true,
        _avg: { prix: true },
      });
      
      // Still need a lightweight query for low stock / out of stock counts if we didn't filter by them
      const allForStats = await prisma.article.findMany({
        where,
        select: {
          quantite: true,
          min_stock: true,
          prix: true,
          bomLines: { select: { quantite: true } }
        }
      });
      
      let totalValue = 0;
      let reservedValue = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let totalCost = 0;

      allForStats.forEach((art) => {
        totalValue += (art.quantite || 0) * (art.prix || 0);
        totalCost += (art.prix || 0);
        
        const calculated_min_stock = calculateEffectiveMinStock(art.bomLines);
        const minStock = calculated_min_stock > 0 ? calculated_min_stock : (art.min_stock || 10);
        
        if ((art.quantite || 0) <= 0) {
          outOfStockCount++;
        } else if ((art.quantite || 0) <= minStock) {
          lowStockCount++;
        }
      });

      // Reserved value is hard to do with aggregate since it depends on prix * reserved_qty per row. 
      // We could compute it by including reserved_qty in allForStats. 
      // But we'll just return what's easy or we can fetch reserved_qty in allForStats too.

      const averageUnitCost = statsAgg._avg.prix || 0;

      return res.json({
        data: finalResult,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalArticlesCount,
          totalPages: Math.ceil(totalArticlesCount / limitNum)
        },
        stats: {
          totalArticles: statsAgg._count || 0,
          availableStock: statsAgg._sum.quantite || 0,
          reservedStock: statsAgg._sum.reserved_qty || 0,
          totalValue, // Calculated manually for exact precision
          reservedValue: 0, // Ignored or computed if needed
          lowStockCount,
          outOfStockCount,
          averageUnitCost
        }
      });
    }

    // Legacy default
    res.json(finalResult);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single article
// @route   GET /stock/articles/:id
// @access  Private
const getArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: { 
        fournisseur: { select: { nom: true } },
        reservationLignes: { select: { quantite: true } },
        bomLines: { select: { quantite: true } }
      },
    });

    if (!article) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    const calculated_min_stock = calculateEffectiveMinStock(article.bomLines);
    const effective_min_stock = calculated_min_stock > 0 ? calculated_min_stock : (article.min_stock || 10);
    const { reservationLignes, bomLines, reserved_qty, ...rest } = article;

    res.json({ ...rest, quantite_reservee: reserved_qty, min_stock: effective_min_stock });
  } catch (error) {
    next(error);
  }
};

// @desc    Create article
// @route   POST /stock/articles
// @access  Private (GL, ADMIN)
const createArticle = async (req, res, next) => {
  try {
    const validation = articleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { id, nom_article, prix, quantite, min_stock, address, fournisseur_id } = validation.data;

    // Check if article ID already exists
    const exists = await prisma.article.findUnique({ where: { id } });
    if (exists) {
      return res.status(409).json({ error: "Un article avec cet ID existe déjà" });
    }

    // Check if supplier exists only when provided
    if (fournisseur_id !== null && fournisseur_id !== undefined) {
      const fournisseurExists = await prisma.fournisseur.findUnique({ where: { id: fournisseur_id } });
      if (!fournisseurExists) {
        return res.status(400).json({ error: "Fournisseur spécifié introuvable" });
      }
    }

    const newArticle = await prisma.article.create({
      data: { id, nom_article, prix, quantite, min_stock, address, fournisseur_id },
      include: { fournisseur: { select: { nom: true } } },
    });

    res.status(201).json(newArticle);
  } catch (error) {
    next(error);
  }
};

// @desc    Update article
// @route   PUT /stock/articles/:id
// @access  Private (GL, ADMIN)
const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = updateArticleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const articleExists = await prisma.article.findUnique({ where: { id } });
    if (!articleExists) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    if (validation.data.fournisseur_id) {
      const fournisseurExists = await prisma.fournisseur.findUnique({ where: { id: validation.data.fournisseur_id } });
      if (!fournisseurExists) {
        return res.status(400).json({ error: "Fournisseur spécifié introuvable" });
      }
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: validation.data,
      include: { fournisseur: { select: { nom: true } } },
    });

    res.json(updatedArticle);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete article
// @route   DELETE /stock/articles/:id
// @access  Private (GL, ADMIN)
const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const articleExists = await prisma.article.findUnique({ where: { id } });
    if (!articleExists) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    // Step 1: Check all dependent relations BEFORE attempting delete
    const [
      mouvementsStock,
      bomLines,
      reservationLignes,
      commandeLignes,
      panneauScraps,
      stockLocations,
      interventionParts,
    ] = await Promise.all([
      prisma.mouvementStock.count({ where: { article_id: id } }),
      prisma.bomLigne.count({ where: { article_id: id } }),
      prisma.reservationLigne.count({ where: { article_id: id } }),
      prisma.commandeLigne.count({ where: { article_id: id } }),
      prisma.panneauScrap.count({ where: { article_id: id } }),
      prisma.stockLocation.count({ where: { articleId: id } }),
      prisma.interventionPart.count({ where: { articleId: id } }),
    ]);

    const dependencies = {
      mouvementsStock,
      bomLines,
      reservationLignes,
      commandeLignes,
      panneauScraps,
      stockLocations,
      interventionParts,
    };

    const hasBlockingDeps = Object.values(dependencies).some((count) => count > 0);

    if (hasBlockingDeps) {
      // Only include non-zero dependencies in the response
      const nonZeroDeps = Object.fromEntries(
        Object.entries(dependencies).filter(([, count]) => count > 0)
      );
      return res.status(409).json({
        error: "Impossible de supprimer cet article.",
        reason: "Cet article est référencé par des enregistrements existants dans le système.",
        dependencies: nonZeroDeps,
      });
    }

    // Step 2: No dependencies — safe to delete
    await prisma.article.delete({ where: { id } });
    return res.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    // Log structured Prisma error details for debugging (not exposed to client)
    console.error('deleteArticle unexpected error:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });
    next(error);
  }
};

// @desc    Search articles (lightweight for AddComponentModal)
// @route   GET /stock/articles/search
// @access  Private
const searchArticlesLight = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const where = {};
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { nom_article: { contains: q, mode: 'insensitive' } },
      ];
    }
    const limitNum = Math.min(parseInt(limit) || 30, 100);

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        nom_article: true,
        prix: true
      },
      take: limitNum
    });

    res.json(articles);
  } catch (error) {
    next(error);
  }
};

// @desc    Get articles by IDs (lightweight for BomTable)
// @route   POST /stock/articles/by-ids
// @access  Private
const getArticlesByIds = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Tableau d'IDs requis." });
    }

    const articles = await prisma.article.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        nom_article: true,
        prix: true,
        quantite: true,
        reserved_qty: true,
        min_stock: true
      }
    });

    // Format for frontend
    const formatted = articles.map(art => ({
      ...art,
      quantite_reservee: art.reserved_qty
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

// @desc    Stock Entrée (Increment stock)
// @route   POST /stock/entrees
// @access  Private (OPERATEUR, GL, ADMIN)
const stockEntree = async (req, res, next) => {
  try {
    const validation = entreeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { po_reference, planification_id, article_id, emplacement, quantite, etat } = validation.data;

    // Delegate to central stockService inside a transaction
    const movement = await prisma.$transaction(async (tx) => {
      return await stockService.receiveStock(tx, {
        articleId: article_id,
        locationName: emplacement,
        quantity: quantite,
        poReference: po_reference,
        planificationId: planification_id,
        etat: etat,
        matricule: req.user?.matricule || null
      });
    }, { maxWait: 5000, timeout: 30000 });

    res.status(201).json(movement);
  } catch (error) {
    next(error);
  }
};

// @desc    Stock Sortie (Decrement stock, error if below 0)
// @route   POST /stock/sorties
// @access  Private (OPERATEUR, GL, ADMIN)
const stockSortie = async (req, res, next) => {
  try {
    const validation = sortieSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { article_id, quantite, emplacement, matricule } = validation.data;

    // Check operator matricule existence
    const operator = await prisma.user.findUnique({ where: { matricule } });
    if (!operator) {
      return res.status(400).json({ error: `Matricule opérateur '${matricule}' invalide` });
    }

    // Delegate to central stockService inside a transaction
    const movement = await prisma.$transaction(async (tx) => {
      return await stockService.issueStock(tx, {
        articleId: article_id,
        locationName: emplacement,
        quantity: quantite,
        matricule
      });
    });

    res.status(201).json(movement);
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movements history with pagination and advanced filtering
// @route   GET /stock/mouvements
// @access  Private
const getMouvements = async (req, res, next) => {
  try {
    const { article_id, type, dateFrom, dateTo, search, page, limit } = req.query;
    const where = {};

    if (article_id) {
      where.article_id = article_id;
    }

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { article_id: { contains: search, mode: 'insensitive' } },
        { emplacement: { contains: search, mode: 'insensitive' } },
        { po_reference: { contains: search, mode: 'insensitive' } },
        { article: { nom_article: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Always paginate unless explicitly requested otherwise for backward compatibility check
    const isPaginated = page !== undefined || limit !== undefined || true; // Default to paginated for performance
    
    // Legacy support (dashboard expects array, if page is 'all' or similar we could bypass, but better to return {data, pagination})
    // For Dashboard: we will modify the dashboard to read res.data.data
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 500); // hard cap at 500
    const skip = (pageNum - 1) * limitNum;

    const [movements, total] = await Promise.all([
      prisma.mouvementStock.findMany({
        where,
        include: {
          article: { select: { nom_article: true } },
          planification: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.mouvementStock.count({ where })
    ]);

    res.json({
      data: movements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movements statistics
// @route   GET /stock/mouvements/stats
// @access  Private
const getMovementStats = async (req, res, next) => {
  try {
    // We compute stats for the current day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalMovements, entriesToday, exitsToday, sumIn, sumOut, uniqueOperators] = await Promise.all([
      prisma.mouvementStock.count(),
      prisma.mouvementStock.count({ where: { type: 'ENTREE', createdAt: { gte: startOfToday } } }),
      prisma.mouvementStock.count({ where: { type: 'SORTIE', createdAt: { gte: startOfToday } } }),
      prisma.mouvementStock.aggregate({ _sum: { quantite: true }, where: { type: 'ENTREE' } }),
      prisma.mouvementStock.aggregate({ _sum: { quantite: true }, where: { type: 'SORTIE' } }),
      prisma.mouvementStock.findMany({
        where: { type: 'SORTIE', matricule: { not: null } },
        select: { matricule: true },
        distinct: ['matricule']
      })
    ]);

    res.json({
      totalMovements,
      entriesToday,
      exitsToday,
      quantityIn: sumIn._sum.quantite || 0,
      quantityOut: sumOut._sum.quantite || 0,
      activeOperators: uniqueOperators.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stock Sortie Bulk (Multiple items in one transaction)
// @route   POST /stock/sorties/bulk
// @access  Private (OPERATEUR, GL, ADMIN)
const stockSortieBulk = async (req, res, next) => {
  try {
    const { matricule, items } = req.body;

    if (!matricule) return res.status(400).json({ error: "Le matricule de l'opérateur est requis" });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "La liste des articles est requise" });
    }

    const operator = await prisma.user.findUnique({ where: { matricule } });
    if (!operator) {
      return res.status(400).json({ error: `Matricule opérateur '${matricule}' invalide` });
    }

    // Convert items format to what issueStockMultiLocationBulk expects if needed
    // The issueStockMultiLocationBulk usually expects grouped requests, but we have specific locations.
    // Let's implement the bulk logic directly here using the transaction if stockService doesn't have the exact method.
    
    const results = await prisma.$transaction(async (tx) => {
      const movements = [];
      for (const item of items) {
        const { article_id, quantite, emplacement } = item;
        
        // This validates and issues the stock location
        const movement = await stockService.issueStock(tx, {
          articleId: article_id,
          locationName: emplacement,
          quantity: quantite,
          matricule
        });
        movements.push(movement);
      }
      return movements;
    }, { maxWait: 10000, timeout: 60000 }); // 60s timeout for large batches

    res.status(201).json({ success: true, imported: results.length, movements: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consumption analytics for an article
// @route   GET /stock/articles/:id/consumption
// @access  Private
const getArticleConsumption = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;
    
    // Parse period (e.g. '7d', '30d', '180d')
    const match = period.match(/^(\d+)d$/);
    const days = match ? parseInt(match[1], 10) : 30;

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const movements = await prisma.mouvementStock.findMany({
      where: {
        article_id: id,
        type: 'SORTIE',
        createdAt: {
          gte: dateLimit,
        },
      },
      select: {
        quantite: true,
        createdAt: true,
      },
    });

    // Group quantities by date (YYYY-MM-DD)
    const dailyData = movements.reduce((acc, mov) => {
      const dateStr = mov.createdAt.toISOString().split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + mov.quantite;
      return acc;
    }, {});

    // Create a complete sequence of dates for the requested period
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const name = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      result.push({
        name,
        date: dateStr,
        consumption: dailyData[dateStr] || 0,
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Export full stock data
// @route   GET /stock/export
// @access  Private
const exportStock = async (req, res, next) => {
  try {
    const { low_stock, search, fournisseur_id } = req.query;

    const where = {};

    if (fournisseur_id && fournisseur_id !== 'all') {
      where.fournisseur_id = fournisseur_id;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { nom_article: { contains: search } },
      ];
    }

    // Fetch Articles
    const articles = await prisma.article.findMany({
      where,
      include: { 
        fournisseur: { select: { nom: true } },
        reservationLignes: { select: { quantite: true } },
        bomLines: { select: { quantite: true } }
      },
      orderBy: { id: 'asc' },
    });

    const formattedArticles = articles.map(art => {
      const calculated_min_stock = calculateEffectiveMinStock(art.bomLines);
      const effective_min_stock = calculated_min_stock > 0 ? calculated_min_stock : (art.min_stock || 10);
      const { reservationLignes, bomLines, reserved_qty, ...rest } = art;
      return { ...rest, quantite_reservee: reserved_qty, min_stock: effective_min_stock, total_global: rest.quantite };
    });

    let finalArticles = formattedArticles;
    if (low_stock === 'true') {
      finalArticles = formattedArticles.filter(a => {
        const globalQty = Number(a.total_global ?? a.quantite ?? 0);
        const minStock = Number(a.min_stock ?? 10);
        return globalQty <= minStock && globalQty > 0;
      });
    }

    const articleIds = finalArticles.map(a => a.id);
    
    // Fallback if no articles matched
    if (articleIds.length === 0) {
      return res.json({ articles: [], movements: [], reservations: [] });
    }

    // Fetch Movements
    const movements = await prisma.mouvementStock.findMany({
      where: { article_id: { in: articleIds } },
      include: {
        article: { select: { nom_article: true } },
        planification: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Reservations
    const reservations = await prisma.reservationLigne.findMany({
      where: { article_id: { in: articleIds } },
      include: {
        article: { select: { nom_article: true } },
        reservation: { select: { reference: true, client: true, status: true, createdAt: true } },
      },
      orderBy: { id: 'desc' },
    });

    res.json({
      articles: finalArticles,
      movements,
      reservations
    });
  } catch (error) {
    next(error);
  }
};

// ── Configuration ──
const BATCH_SIZE = 25; // Configurable batch size for bulk imports
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

// @desc    Import stock from Excel (simplified 3-column format)
// @route   POST /stock/import
// @access  Private (GL, ADMIN, OPERATEUR)
const importStockMovements = async (req, res, next) => {
  try {
    const { rows, matricule, fileHash, fileName, isPreview } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "Format de données invalide ou fichier vide" });
    }

    if (!fileHash && !isPreview) {
      return res.status(400).json({ error: "Hash du fichier manquant pour prévenir les doublons." });
    }

    // Check for duplicate file import (skip in preview mode)
    if (fileHash) {
      const existingImport = await prisma.importHistory.findUnique({ where: { fileHash } });
      if (existingImport) {
        return res.status(409).json({ error: "Ce fichier a déjà été importé précédemment." });
      }
    }

    // ══════════════════════════════════════════════════════════
    // PHASE 1: VALIDATE ALL ROWS (no DB writes)
    // ══════════════════════════════════════════════════════════

    const validationErrors = [];
    const validRows = [];

    // Batch-read: collect all article codes and fournisseur IDs upfront
    const allArticleCodes = [...new Set(
      rows.map(r => (r["Article Code"] || "").toString().trim()).filter(Boolean)
    )];
    const allFournisseurIds = [...new Set(
      rows.map(r => r["Fournisseur ID"] || r["Supplier ID"]).filter(Boolean)
    )];

    // One findMany for all articles, one for all fournisseurs
    const existingArticles = await prisma.article.findMany({
      where: { id: { in: allArticleCodes } },
      select: { id: true, nom_article: true, address: true, quantite: true }
    });
    const existingArticleMap = new Map(existingArticles.map(a => [a.id, a]));

    const existingFournisseurs = await prisma.fournisseur.findMany({
      where: { id: { in: allFournisseurIds } },
      select: { id: true, nom: true }
    });
    const existingFournisseurMap = new Map(existingFournisseurs.map(f => [f.id, f]));

    // Aggregation map: key = "articleCode::location"
    const aggregated = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = (row["Article Code"] || "").toString().trim();
      const qty = Number(row["Quantity"]) || 0;
      const loc = (row["Location"] || "").toString().trim();
      const fournisseurIdRaw = row["Fournisseur ID"] || row["Supplier ID"];
      const fournisseurId = fournisseurIdRaw || null;

      if (!code) {
        validationErrors.push({ row: i + 1, data: row, error: "Code article manquant" });
        continue;
      }

      if (qty <= 0) {
        validationErrors.push({ row: i + 1, data: row, error: "La quantité doit être supérieure à 0" });
        continue;
      }

      const existingArticle = existingArticleMap.get(code);
      let effLocation = loc;
      let isNew = false;
      let articleName = code;

      if (!existingArticle) {
        if (fournisseurId && !existingFournisseurMap.has(fournisseurId)) {
          validationErrors.push({ row: i + 1, data: row, error: `Fournisseur ID ${fournisseurId} introuvable.` });
          continue;
        }
        isNew = true;
        effLocation = loc || 'N/A';
      } else {
        effLocation = loc || existingArticle.address || 'N/A';
        articleName = existingArticle.nom_article;
      }

      validRows.push({
        "Article Code": code,
        "Article Name": articleName,
        "Quantity": qty,
        "Location": effLocation,
        "Status": "Valid",
        "Action": isNew ? "CREATE" : "UPDATE"
      });

      const key = `${code}::${effLocation}`;
      if (aggregated[key]) {
        aggregated[key].quantity += qty;
        if (isNew && !aggregated[key].fournisseurId && fournisseurId) {
          aggregated[key].fournisseurId = fournisseurId;
        }
      } else {
        aggregated[key] = {
          articleCode: code,
          quantity: qty,
          location: effLocation,
          isNew,
          fournisseurId
        };
      }
    }

    // ── Preview mode: return validation results without DB writes ──
    if (isPreview) {
      return res.json({
        successCount: validRows.length,
        failedCount: validationErrors.length,
        previewRows: [
          ...validRows,
          ...validationErrors.map(e => ({ ...e.data, "Status": "Error", "Error": e.error }))
        ],
        canImport: validRows.length > 0
      });
    }

    if (validRows.length === 0) {
      return res.status(400).json({
        error: "Le fichier ne contient aucune ligne valide à importer.",
        failedRows: validationErrors
      });
    }

    // ══════════════════════════════════════════════════════════
    // PHASE 2: BATCHED DB WRITES
    // ══════════════════════════════════════════════════════════

    // Record import history first (outside batch transactions)
    if (fileHash) {
      await prisma.importHistory.create({
        data: { fileHash, fileName: fileName || 'Import Excel' }
      });
    }

    // Resolve UNKNOWN supplier once (outside transactions)
    let unknownSupplierId = null;
    const needsUnknownSupplier = Object.values(aggregated).some(d => d.isNew && !d.fournisseurId);
    if (needsUnknownSupplier) {
      let unknownSupplier = await prisma.fournisseur.findFirst({
        where: { nom: { in: ['UNKNOWN (IMPORT)', 'UNKNOWN'] } },
        orderBy: { id: 'asc' }
      });
      if (!unknownSupplier) {
        unknownSupplier = await prisma.fournisseur.create({
          data: { nom: 'UNKNOWN (IMPORT)' }
        });
      }
      unknownSupplierId = unknownSupplier.id;
    }

    // Split aggregated entries into batches
    const allEntries = Object.values(aggregated);
    const totalBatches = Math.ceil(allEntries.length / BATCH_SIZE);
    const batchResults = [];
    let totalCreated = 0;
    let totalUpdated = 0;
    const successfulRows = [];

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batch = allEntries.slice(batchStart, batchStart + BATCH_SIZE);

      let batchSuccess = false;
      let batchError = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await prisma.$transaction(async (tx) => {
            // ── Step A: Create new articles (one createMany) ──
            const newArticles = [];
            const createdArticleCodes = new Set();

            for (const entry of batch) {
              if (entry.isNew && !createdArticleCodes.has(entry.articleCode)) {
                // Check it wasn't created in a previous batch
                const alreadyExists = await tx.article.findUnique({
                  where: { id: entry.articleCode },
                  select: { id: true }
                });
                if (!alreadyExists) {
                  newArticles.push({
                    id: entry.articleCode,
                    nom_article: entry.articleCode,
                    prix: 0,
                    quantite: 0,
                    address: entry.location,
                    fournisseur_id: entry.fournisseurId || unknownSupplierId,
                    min_stock: 100,
                  });
                  createdArticleCodes.add(entry.articleCode);
                }
              }
            }

            if (newArticles.length > 0) {
              await tx.article.createMany({ data: newArticles });
              totalCreated += newArticles.length;
            }

            // ── Step B: Bulk receive stock via optimized service ──
            const receiveOps = batch.map(entry => ({
              articleId: entry.articleCode,
              locationName: entry.location,
              quantity: entry.quantity,
              poReference: `Import Excel`,
              etat: true,
              matricule: matricule || null,
            }));

            await stockService.receiveStockBulk(tx, receiveOps);

            // Count updates (articles that already existed)
            const updatedInBatch = batch.filter(e => !e.isNew).length;
            totalUpdated += updatedInBatch;

          }, { maxWait: 10000, timeout: 60000 });

          // Batch succeeded
          batchSuccess = true;

          // Record successful rows for this batch
          for (const entry of batch) {
            successfulRows.push({
              "Article Code": entry.articleCode,
              "Quantity": entry.quantity,
              "Location": entry.location,
              "Action": entry.isNew ? "CREATED" : "UPDATED",
            });
          }

          batchResults.push({
            batch: batchIndex + 1,
            totalBatches,
            status: "SUCCESS",
            records: batch.length,
          });
          break; // Exit retry loop

        } catch (error) {
          if (error.code === 'P2034' && attempt < MAX_RETRIES - 1) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`Batch ${batchIndex + 1}: Write conflict (P2034), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          batchError = error;
          break;
        }
      }

      if (!batchSuccess) {
        batchResults.push({
          batch: batchIndex + 1,
          totalBatches,
          status: "FAILED",
          records: batch.length,
          error: batchError?.message || "Unknown error",
        });
      }
    }

    // ══════════════════════════════════════════════════════════
    // PHASE 3: RESPONSE
    // ══════════════════════════════════════════════════════════

    const failedBatches = batchResults.filter(b => b.status === "FAILED");
    const successBatchCount = batchResults.filter(b => b.status === "SUCCESS").length;
    const failedRecordCount = failedBatches.reduce((sum, b) => sum + b.records, 0);

    res.json({
      successCount: successfulRows.length,
      failedCount: validationErrors.length + failedRecordCount,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      totalBatches,
      successBatchCount,
      failedBatchCount: failedBatches.length,
      batchSize: BATCH_SIZE,
      batchResults,
      failedRows: validationErrors.map(e => ({ ...e.data, "Status": "Error", "Error": e.error })),
      successfulRows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import stock from Excel in controlled frontend-driven batches
// @route   POST /stock/import/batch
// @access  Private (GL, ADMIN, OPERATEUR)
const importStockBatch = async (req, res, next) => {
  try {
    const { rows, matricule, fileHash, fileName } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "Format de données invalide ou batch vide" });
    }

    // Record import history first (only if fileHash provided, i.e., first batch)
    if (fileHash) {
      const existingImport = await prisma.importHistory.findUnique({ where: { fileHash } });
      if (!existingImport) {
        await prisma.importHistory.create({
          data: { fileHash, fileName: fileName || 'Import Excel Batch' }
        });
      }
    }

    // PHASE 1: VALIDATE BATCH
    const validationErrors = [];
    const validRows = [];

    const allArticleCodes = [...new Set(rows.map(r => (r["Article Code"] || "").toString().trim()).filter(Boolean))];
    const allFournisseurIds = [...new Set(rows.map(r => r["Fournisseur ID"] || r["Supplier ID"]).filter(Boolean))];

    const existingArticles = await prisma.article.findMany({
      where: { id: { in: allArticleCodes } },
      select: { id: true, nom_article: true, address: true, quantite: true }
    });
    const existingArticleMap = new Map(existingArticles.map(a => [a.id, a]));

    const existingFournisseurs = await prisma.fournisseur.findMany({
      where: { id: { in: allFournisseurIds } },
      select: { id: true, nom: true }
    });
    const existingFournisseurMap = new Map(existingFournisseurs.map(f => [f.id, f]));

    const aggregated = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = (row["Article Code"] || "").toString().trim();
      const qty = Number(row["Quantity"]) || 0;
      const loc = (row["Location"] || "").toString().trim();
      const fournisseurIdRaw = row["Fournisseur ID"] || row["Supplier ID"];
      const fournisseurId = fournisseurIdRaw || null;

      if (!code) {
        validationErrors.push({ ...row, Error: "Code article manquant" });
        continue;
      }
      if (qty <= 0) {
        validationErrors.push({ ...row, Error: "La quantité doit être supérieure à 0" });
        continue;
      }

      const existingArticle = existingArticleMap.get(code);
      let effLocation = loc;
      let isNew = false;

      if (!existingArticle) {
        if (fournisseurId && !existingFournisseurMap.has(fournisseurId)) {
          validationErrors.push({ ...row, Error: `Fournisseur ID ${fournisseurId} introuvable.` });
          continue;
        }
        isNew = true;
        effLocation = loc || 'N/A';
      } else {
        effLocation = loc || existingArticle.address || 'N/A';
      }

      validRows.push({ ...row, Status: "Valid" });
      const key = `${code}::${effLocation}`;
      if (aggregated[key]) {
        aggregated[key].quantity += qty;
        if (isNew && !aggregated[key].fournisseurId && fournisseurId) {
          aggregated[key].fournisseurId = fournisseurId;
        }
      } else {
        aggregated[key] = {
          articleCode: code,
          quantity: qty,
          location: effLocation,
          isNew,
          fournisseurId
        };
      }
    }

    if (validRows.length === 0) {
      return res.status(400).json({
        imported: 0,
        skipped: validationErrors.length,
        errors: validationErrors,
        created: 0,
        updated: 0
      });
    }

    // Resolve UNKNOWN supplier
    let unknownSupplierId = null;
    const needsUnknownSupplier = Object.values(aggregated).some(d => d.isNew && !d.fournisseurId);
    if (needsUnknownSupplier) {
      let unknownSupplier = await prisma.fournisseur.findFirst({
        where: { nom: { in: ['UNKNOWN (IMPORT)', 'UNKNOWN'] } },
        orderBy: { id: 'asc' }
      });
      if (!unknownSupplier) {
        unknownSupplier = await prisma.fournisseur.create({
          data: {
            nom: 'UNKNOWN (IMPORT)',
            contact: 'Unknown'
          }
        });
      }
      unknownSupplierId = unknownSupplier.id;
    }

    // Execute in one transaction with retry
    let totalCreated = 0;
    let totalUpdated = 0;
    let batchSuccess = false;
    let batchError = null;
    const batchData = Object.values(aggregated);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await prisma.$transaction(async (tx) => {
          const newArticles = [];
          for (const entry of batchData) {
            if (entry.isNew) {
              const alreadyExists = await tx.article.findUnique({
                where: { id: entry.articleCode },
                select: { id: true }
              });
              if (!alreadyExists) {
                newArticles.push({
                  id: entry.articleCode,
                  nom_article: entry.articleCode,
                  prix: 0,
                  quantite: 0,
                  address: entry.location,
                  fournisseur_id: entry.fournisseurId || unknownSupplierId,
                  min_stock: 100,
                });
              }
            }
          }

          if (newArticles.length > 0) {
            await tx.article.createMany({ data: newArticles });
            totalCreated += newArticles.length;
          }

          const receiveOps = batchData.map(entry => ({
            articleId: entry.articleCode,
            locationName: entry.location,
            quantity: entry.quantity,
            poReference: `Batch Import`,
            etat: true,
            matricule: matricule || "IMPORT"
          }));

          const stockService = require('../services/stock/stockService');
          await stockService.receiveStockBulk(tx, receiveOps);
          
          totalUpdated += batchData.filter(e => !e.isNew).length;
        }, { maxWait: 10000, timeout: 60000 });

        batchSuccess = true;
        break;
      } catch (error) {
        if (error.code === 'P2034' && attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        batchError = error;
        break;
      }
    }

    if (!batchSuccess) {
      throw batchError || new Error("Failed to process batch");
    }

    res.json({
      imported: validRows.length,
      skipped: validationErrors.length,
      errors: validationErrors,
      created: totalCreated,
      updated: totalUpdated
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  stockEntree,
  stockSortie,
  stockSortieBulk,
  getMouvements,
  getMovementStats,
  getArticleConsumption,
  exportStock,
  importStockMovements,
  importStockBatch,
  searchArticlesLight,
  getArticlesByIds
};
