const { z } = require('zod');
const prisma = require('../config/db');

const entrepotSchema = z.object({
  nom: z.string().min(1, "Le nom de l'entrepôt est requis"),
  emplacement: z.string().optional().nullable(),
});

// @desc    Get all warehouses
// @route   GET /entrepots
// @access  Private
const getEntrepots = async (req, res, next) => {
  try {
    const entrepots = await prisma.entrepot.findMany({
      orderBy: { nom: 'asc' },
    });
    res.json(entrepots);
  } catch (error) {
    next(error);
  }
};

// @desc    Create warehouse
// @route   POST /entrepots
// @access  Private (GL, ADMIN)
const createEntrepot = async (req, res, next) => {
  try {
    const validation = entrepotSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const newEntrepot = await prisma.entrepot.create({
      data: validation.data,
    });

    res.status(201).json(newEntrepot);
  } catch (error) {
    next(error);
  }
};

// @desc    Update warehouse
// @route   PUT /entrepots/:id
// @access  Private (GL, ADMIN)
const updateEntrepot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = entrepotSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const existingEntrepot = await prisma.entrepot.findUnique({ where: { id: id } });
    if (!existingEntrepot) {
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }

    const updated = await prisma.entrepot.update({
      where: { id: id },
      data: validation.data,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete warehouse
// @route   DELETE /entrepots/:id
// @access  Private (GL, ADMIN)
const deleteEntrepot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingEntrepot = await prisma.entrepot.findUnique({ where: { id: id } });
    if (!existingEntrepot) {
      return res.status(404).json({ error: "Entrepôt non trouvé" });
    }

    await prisma.entrepot.delete({ where: { id: id } });
    res.json({ message: "Entrepôt supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEntrepots,
  createEntrepot,
  updateEntrepot,
  deleteEntrepot,
};
