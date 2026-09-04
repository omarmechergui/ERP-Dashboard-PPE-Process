const { z } = require("zod");
const prisma = require("../config/db");

const bomSchema = z.object({
  nom_projet: z.string().min(1, "Le nom du projet est requis"),
  nom_bom: z.string().min(1, "Le nom de la BOM est requis"),
  jig: z.string().min(1, "Le jig est requis"),
  contrepartie: z.string().min(1, "La contrepartie est requise"),
  clip: z.string().min(1, "Le clip est requis"),
});

const bomLineSchema = z.object({
  article_id: z.string().min(1, "L'ID de l'article est requis"),
  quantite: z.number().positive("La quantité doit être supérieure à 0"),
  prix: z.number().nonnegative().optional(), // If not provided, we can pull from article price
});

// @desc    Get all BOMs
// @route   GET /bom
// @access  Private
const getBoms = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    
    // For backward compatibility: if no pagination params, return all
    const isPaginated = page !== undefined || limit !== undefined;
    
    const where = {};
    if (search) {
      where.OR = [
        { nom_bom: { contains: search, mode: "insensitive" } },
        { nom_projet: { contains: search, mode: "insensitive" } },
        { jig: { contains: search, mode: "insensitive" } },
        { contrepartie: { contains: search, mode: "insensitive" } },
        { clip: { contains: search, mode: "insensitive" } },
      ];
    }

    const select = {
      id: true,
      nom_projet: true,
      nom_bom: true,
      jig: true,
      contrepartie: true,
      clip: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { lignes: true } },
    };

    if (!isPaginated) {
      const boms = await prisma.bOM.findMany({
        where,
        select,
        orderBy: { createdAt: "desc" },
      });
      return res.json(boms);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const [boms, total] = await Promise.all([
      prisma.bOM.findMany({
        where,
        select,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.bOM.count({ where })
    ]);

    res.json({
      data: boms,
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

// @desc    Get single BOM details
// @route   GET /bom/:id
// @access  Private
const getBomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bom = await prisma.bOM.findUnique({
      where: { id: id },
      select: {
        id: true,
        nom_projet: true,
        nom_bom: true,
        jig: true,
        contrepartie: true,
        clip: true,
        createdAt: true,
        updatedAt: true,
        lignes: {
          select: {
            id: true,
            bom_id: true,
            article_id: true,
            quantite: true,
            prix: true,
            article: { select: { id: true, nom_article: true, prix: true } },
          },
        },
      },
    });

    if (!bom) {
      return res.status(404).json({ error: "BOM non trouvée" });
    }

    res.json(bom);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a BOM
// @route   POST /bom
// @access  Private (GL, ADMIN)
const createBom = async (req, res, next) => {
  try {
    const validation = bomSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors[0].message });
    }

    const { nom_projet, nom_bom, jig, contrepartie, clip } = validation.data;

    // Check if BOM name is unique
    const exists = await prisma.bOM.findUnique({ where: { nom_bom } });
    if (exists) {
      return res.status(409).json({ error: "Une BOM avec ce nom existe déjà" });
    }

    const newBom = await prisma.bOM.create({
      data: { nom_projet, nom_bom, jig, contrepartie, clip },
    });

    res.status(201).json(newBom);
  } catch (error) {
    next(error);
  }
};

// @desc    Update BOM
// @route   PUT /bom/:id
// @access  Private (GL, ADMIN)
const updateBom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = bomSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors[0].message });
    }

    const { nom_projet, nom_bom, jig, contrepartie, clip } = validation.data;

    const existingBom = await prisma.bOM.findUnique({
      where: { id: id },
    });
    if (!existingBom) {
      return res.status(404).json({ error: "BOM non trouvée" });
    }

    // Check name uniqueness if changed
    if (nom_bom !== existingBom.nom_bom) {
      const exists = await prisma.bOM.findUnique({ where: { nom_bom } });
      if (exists)
        return res
          .status(409)
          .json({ error: "Le nom de la BOM est déjà utilisé" });
    }

    const updatedBom = await prisma.bOM.update({
      where: { id: id },
      data: { nom_projet, nom_bom, jig, contrepartie, clip },
    });

    res.json(updatedBom);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete BOM
// @route   DELETE /bom/:id
// @access  Private (GL, ADMIN)
const deleteBom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingBom = await prisma.bOM.findUnique({
      where: { id: id },
    });
    if (!existingBom) {
      return res.status(404).json({ error: "BOM non trouvée" });
    }

    await prisma.bOM.delete({ where: { id: id } });
    res.json({ message: "BOM supprimée avec succès" });
  } catch (error) {
    next(error);
  }
};

// ================= BOM LINES CRUD =================

// @desc    Get lines of a BOM
// @route   GET /bom/:id/lignes
// @access  Private
const getBomLines = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lines = await prisma.bomLigne.findMany({
      where: { bom_id: id },
      select: {
        id: true,
        bom_id: true,
        article_id: true,
        quantite: true,
        prix: true,
        article: { select: { id: true, nom_article: true, prix: true } }
      },
    });
    res.json(lines);
  } catch (error) {
    next(error);
  }
};

// @desc    Add line to BOM
// @route   POST /bom/:id/lignes
// @access  Private (GL, ADMIN)
const addBomLine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = bomLineSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors[0].message });
    }

    const { article_id, quantite, prix } = validation.data;

    // Check if BOM exists
    const bom = await prisma.bOM.findUnique({ where: { id: id } });
    if (!bom) return res.status(404).json({ error: "BOM non trouvée" });

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: article_id },
    });
    if (!article) return res.status(404).json({ error: "Article non trouvé" });

    // Check if article is already linked in this BOM
    const lineExists = await prisma.bomLigne.findFirst({
      where: { bom_id: id, article_id },
    });

    if (lineExists) {
      return res
        .status(409)
        .json({ error: "Cet article est déjà présent dans la BOM" });
    }

    // Set snapshot price (use provided price, or fallback to article's current price)
    const snapshotPrice = prix !== undefined ? prix : article.prix;

    const newLine = await prisma.bomLigne.create({
      data: {
        bom_id: id,
        article_id,
        quantite,
        prix: snapshotPrice,
      },
      include: { article: { select: { nom_article: true } } },
    });

    res.status(201).json(newLine);
  } catch (error) {
    next(error);
  }
};

// @desc    Update BOM line
// @route   PUT /bom/:id/lignes/:lineId
// @access  Private (GL, ADMIN)
const updateBomLine = async (req, res, next) => {
  try {
    const { lineId } = req.params;
    const validation = bomLineSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors[0].message });
    }

    const existingLine = await prisma.bomLigne.findUnique({
      where: { id: lineId },
    });
    if (!existingLine)
      return res.status(404).json({ error: "Ligne de BOM non trouvée" });

    const updated = await prisma.bomLigne.update({
      where: { id: lineId },
      data: validation.data,
      include: { article: { select: { nom_article: true } } },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete BOM line
// @route   DELETE /bom/:id/lignes/:lineId
// @access  Private (GL, ADMIN)
const deleteBomLine = async (req, res, next) => {
  try {
    const { lineId } = req.params;
    const existingLine = await prisma.bomLigne.findUnique({
      where: { id: lineId },
    });
    if (!existingLine)
      return res.status(404).json({ error: "Ligne de BOM non trouvée" });

    await prisma.bomLigne.delete({ where: { id: lineId } });
    res.json({ message: "Ligne supprimée de la BOM avec succès" });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import BOM lines
// @route   POST /bom/:id/lignes/bulk
// @access  Private (GL, ADMIN)
const importBomLinesBulk = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lines } = req.body;

    if (!lines || !Array.isArray(lines)) {
      return res.status(400).json({ error: "Format invalide, un tableau de lignes est requis." });
    }

    const bom = await prisma.bOM.findUnique({ where: { id } });
    if (!bom) return res.status(404).json({ error: "BOM non trouvée" });

    // Validate articles
    const articleIds = lines.map(l => l.article_id);
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, prix: true }
    });
    
    const articleMap = new Map(articles.map(a => [a.id, a]));
    const newLines = [];

    // Get existing lines to avoid duplicates
    const existingLines = await prisma.bomLigne.findMany({
      where: { bom_id: id },
      select: { article_id: true }
    });
    const existingIds = new Set(existingLines.map(l => l.article_id));

    for (const line of lines) {
      if (!articleMap.has(line.article_id) || existingIds.has(line.article_id)) {
        continue;
      }
      
      const article = articleMap.get(line.article_id);
      
      newLines.push({
        bom_id: id,
        article_id: line.article_id,
        quantite: parseFloat(line.quantite),
        prix: line.prix !== undefined ? parseFloat(line.prix) : article.prix,
      });
      existingIds.add(line.article_id);
    }

    if (newLines.length > 0) {
      await prisma.bomLigne.createMany({ data: newLines });
    }

    res.status(201).json({ imported: newLines.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get BOM Statistics
// @route   GET /bom/stats/summary
// @access  Private
const getBomStats = async (req, res, next) => {
  try {
    const [totalBoms, bomsWithProjects] = await Promise.all([
      prisma.bOM.count(),
      prisma.bOM.findMany({ select: { nom_projet: true }, distinct: ['nom_projet'] })
    ]);

    const lignes = await prisma.bomLigne.aggregate({
      _count: { id: true }
    });
    
    // We compute total cost from lines
    const allLines = await prisma.bomLigne.findMany({
      select: { quantite: true, prix: true }
    });
    
    const totalCost = allLines.reduce((acc, curr) => acc + (curr.quantite * curr.prix), 0);

    res.json({
      totalBoms,
      totalComponents: lignes._count.id,
      projectCount: bomsWithProjects.filter(b => !!b.nom_projet).length,
      totalCost
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBoms,
  getBomById,
  createBom,
  updateBom,
  deleteBom,
  getBomLines,
  addBomLine,
  updateBomLine,
  deleteBomLine,
  importBomLinesBulk,
  getBomStats
};
