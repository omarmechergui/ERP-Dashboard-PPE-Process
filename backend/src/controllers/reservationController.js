const { z } = require('zod');
const prisma = require('../config/db');
const crypto = require('crypto');
const stockService = require('../services/stock/stockService');

const reservationLigneSchema = z.object({
  article_id: z.string().min(1, "L'ID de l'article est requis"),
  quantite: z.number().int().positive("La quantité doit être supérieure à 0"),
});

const reservationSchema = z.object({
  client: z.string().min(1, "Le nom du client est requis"),
  lignes: z.array(reservationLigneSchema).min(1, "La reservation doit contenir au moins un article"),
});

// @desc    Get all reservations
// @route   GET /reservations
// @access  Private
const getReservations = async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        lignes: {
          include: {
            article: { select: { nom_article: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new reservation
// @route   POST /reservations
// @access  Private (GL, ADMIN)
const createReservation = async (req, res, next) => {
  try {
    const validation = reservationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { client, lignes } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const reservationLignesData = [];

      for (const ligne of lignes) {
        const article = await tx.article.findUnique({ where: { id: ligne.article_id } });
        
        if (!article) {
          throw new Error(`Article ${ligne.article_id} introuvable`);
        }

        // Use stockService to allocate reservation
        await stockService.allocateReservation(tx, {
          articleId: ligne.article_id,
          quantity: ligne.quantite
        });

        const ligneTotal = article.prix * ligne.quantite;
        total += ligneTotal;

        reservationLignesData.push({
          article_id: article.id,
          quantite: ligne.quantite,
          prix: article.prix,
        });
      }

      let reference;
      let isUnique = false;
      while (!isUnique) {
        const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
        reference = `CMD-${new Date().getFullYear()}-${rand}`;
        const existing = await tx.reservation.findUnique({ where: { reference } });
        if (!existing) isUnique = true;
      }

      const reservation = await tx.reservation.create({
        data: {
          reference,
          client,
          total,
          status: "EN_ATTENTE", 
          lignes: {
            create: reservationLignesData,
          },
        },
        include: { lignes: true }
      });

      return reservation;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message && (error.message.includes("introuvable") || error.message.includes("insuffisant"))) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// @desc    Validate a reservation (Approve, no stock deduction)
// @route   PATCH /reservations/:id/validate
// @access  Private (GL, ADMIN)
const validateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id: id },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation introuvable" });
    }

    if (reservation.status !== 'EN_ATTENTE') {
      return res.status(400).json({ error: "Seules les réservations EN_ATTENTE peuvent être validées" });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: id },
      data: { status: "VALIDEE" }
    });

    res.json(updatedReservation);
  } catch (error) {
    next(error);
  }
};

// @desc    Consume a validated reservation (Deduct physical stock and release reserved_qty)
// @route   PATCH /reservations/:id/consume
// @access  Private (GL, ADMIN)
const consumeReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id: id },
      include: { lignes: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation introuvable" });
    }

    if (reservation.status !== 'VALIDEE') {
      return res.status(400).json({ error: "Seules les réservations VALIDEE peuvent être consommées" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Deduct stock and reserved_qty, and create MouvementStock via stockService
      for (const ligne of reservation.lignes) {
         await stockService.consumeReservedStock(tx, {
           articleId: ligne.article_id,
           quantity: ligne.quantite,
           matricule: req.user?.matricule || 'SYSTEM'
         });
      }

      const updatedReservation = await tx.reservation.update({
        where: { id: id },
        data: { status: "CONSUMED" }
      });

      return updatedReservation;
    });

    res.json(result);
  } catch (error) {
    if (error.message && (
      error.message.includes("invalide") || 
      error.message.includes("insuffisant") || 
      error.message.includes("introuvable") ||
      error.message.includes("allocation")
    )) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// @desc    Cancel a reservation (Release reserved_qty)
// @route   PATCH /reservations/:id/cancel
// @access  Private (GL, ADMIN)
const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id: id },
      include: { lignes: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation introuvable" });
    }

    if (reservation.status !== 'EN_ATTENTE' && reservation.status !== 'VALIDEE') {
      return res.status(400).json({ error: `Impossible d'annuler une réservation en statut ${reservation.status}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Release reserved_qty via stockService
      for (const ligne of reservation.lignes) {
         await stockService.releaseReservation(tx, {
           articleId: ligne.article_id,
           quantity: ligne.quantite
         });
      }

      const updatedReservation = await tx.reservation.update({
        where: { id: id },
        data: { status: "ANNULEE" }
      });

      return updatedReservation;
    });

    res.json(result);
  } catch (error) {
    if (error.message && (
      error.message.includes("invalide") || 
      error.message.includes("introuvable") ||
      error.message.includes("insuffisante")
    )) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
    getReservations,
    createReservation,
    validateReservation,
    consumeReservation,
    cancelReservation,
};
