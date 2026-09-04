const prisma = require("../config/db");
const { z } = require("zod");
const stockService = require("../services/stock/stockService");

const commandeLigneSchema = z.object({
  article_id: z.string().min(1, "L'ID de l'article est requis"),
  quantite: z.number().int().positive("La quantité doit être supérieure à 0"),
  prix: z.number().finite().nonnegative("Le prix ne peut pas être négatif"),
});

const createCommandeSchema = z.object({
  fournisseur_id: z.string().min(1, "L'ID du fournisseur est requis"),
  lignes: z.array(commandeLigneSchema).min(1, "La commande doit contenir au moins une ligne"),
});

// Generate reference CMD001
const generateReference = async (tx) => {
  const { nextSeq } = require("../helpers/counterHelper");
  const nextId = await nextSeq(tx, "commande");
  return `CMD${String(nextId).padStart(3, "0")}`;
};

// @desc Create Commande
// @route POST /api/commandes
const createCommande = async (req, res, next) => {
  try {
    const validation = createCommandeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { fournisseur_id, lignes } = validation.data;

    // Check fournisseur

    const fournisseur = await prisma.fournisseur.findUnique({
      where: {
        id: fournisseur_id,
      },
    });

    if (!fournisseur) {
      return res.status(404).json({
        error: "Fournisseur non trouvé",
      });
    }

    let total = 0;

    lignes.forEach((item) => {
      total += item.quantite * item.prix;
    });

    const reference = await generateReference(prisma);

    const commande = await prisma.commande.create({
      data: {
        reference,

        fournisseur_id,

        status: "PENDING",

        total,

        lignes: {
          create: lignes.map((item) => ({
            article_id: item.article_id,

            quantite: item.quantite,

            prix: item.prix,
          })),
        },
      },

      include: {
        fournisseur: true,

        lignes: true,
      },
    });

    res.status(201).json(commande);
  } catch (error) {
    next(error);
  }
};

// @desc Get all commandes
// @route GET /api/commandes
const getCommandes = async (req, res, next) => {
  try {
    const commandes = await prisma.commande.findMany({
      include: {
        fournisseur: {
          select: {
            nom: true,
          },
        },

        lignes: {
          include: {
            article: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(commandes);
  } catch (error) {
    next(error);
  }
};

// @desc Get one commande
// @route GET /api/commandes/:id
const getCommandeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const commande = await prisma.commande.findUnique({
      where: {
        id: id,
      },

      include: {
        fournisseur: true,

        lignes: {
          include: {
            article: true,
          },
        },
      },
    });

    if (!commande) {
      return res.status(404).json({
        error: "Commande non trouvée",
      });
    }

    res.json(commande);
  } catch (error) {
    next(error);
  }
};

const receiveCommande = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedCommande = await prisma.$transaction(async (tx) => {
      const commande = await tx.commande.findUnique({
        where: { id: id },
        include: { lignes: true }
      });

      if (!commande) {
        throw new Error("Commande non trouvée");
      }

      if (commande.status === "RECEIVED") {
        throw new Error("Commande déjà reçue");
      }

      // Update the stock for each article and record MouvementStock
      for (const ligne of commande.lignes) {
        const article = await tx.article.findUnique({
          where: { id: ligne.article_id }
        });

        if (!article) {
          throw new Error(`Article ${ligne.article_id} introuvable`);
        }

        await stockService.receiveStock(tx, {
          articleId: ligne.article_id,
          locationName: article.address || "STOCK",
          quantity: ligne.quantite,
          poReference: commande.reference,
          etat: true,
          matricule: req.user?.matricule || null
        });
      }

      const updated = await tx.commande.update({
        where: { id: id },
        data: { status: "RECEIVED" }
      });

      return updated;
    }, { maxWait: 5000, timeout: 15000 });

    res.json(updatedCommande);
  } catch (error) {
    if (error.message === "Commande non trouvée") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Commande déjà reçue" || error.message.includes("introuvable")) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  createCommande,
  getCommandes,
  getCommandeById,
  receiveCommande,
};
