const { z } = require('zod');
const prisma = require('../config/db');

const fournisseurSchema = z.object({
  nom: z.string().min(1, "Le nom du fournisseur est requis"),
  contact: z.string().optional(),
});

// @desc    Get all fournisseurs
// @route   GET /fournisseurs
// @access  Private
const getFournisseurs = async (req, res, next) => {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      orderBy: { nom: 'asc' },
    });
    res.json(fournisseurs);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fournisseur
// @route   GET /fournisseurs/:id
// @access  Private
const getFournisseurById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id: id },
    });

    if (!fournisseur) {
      return res.status(404).json({ error: "Fournisseur non trouvé" });
    }

    res.json(fournisseur);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a fournisseur
// @route   POST /fournisseurs
// @access  Private (GL, ADMIN)
const createFournisseur = async (req, res, next) => {
  try {
    const validation = fournisseurSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { nom, contact } = validation.data;

    // Check if supplier already exists to prevent duplicates
    const existingFournisseur = await prisma.fournisseur.findFirst({
      where: {
        nom: {
          equals: nom
        }
      }
    });

    if (existingFournisseur) {
      // If it exists, return the existing one with a 200 OK
      return res.status(200).json(existingFournisseur);
    }

    const newFournisseur = await prisma.fournisseur.create({
      data: { nom, contact },
    });

    res.status(201).json(newFournisseur);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a fournisseur
// @route   PUT /fournisseurs/:id
// @access  Private (GL, ADMIN)
const updateFournisseur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = fournisseurSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { nom, contact } = validation.data;

    const existingFournisseur = await prisma.fournisseur.findUnique({
      where: { id: id },
    });

    if (!existingFournisseur) {
      return res.status(404).json({ error: "Fournisseur non trouvé" });
    }

    const updatedFournisseur = await prisma.fournisseur.update({
      where: { id: id },
      data: { nom, contact },
    });

    res.json(updatedFournisseur);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a fournisseur
// @route   DELETE /fournisseurs/:id
// @access  Private (GL, ADMIN)
const deleteFournisseur = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingFournisseur = await prisma.fournisseur.findUnique({
      where: { id: id },
    });

    if (!existingFournisseur) {
      return res.status(404).json({ error: "Fournisseur non trouvé" });
    }

    await prisma.fournisseur.delete({
      where: { id: id },
    });

    res.json({ message: "Fournisseur supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
};
