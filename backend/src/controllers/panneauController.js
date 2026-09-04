const { z } = require('zod');
const prisma = require('../config/db');
const stockService = require('../services/stock/stockService');

const panneauSchema = z.object({
  id: z.string().min(1, "L'ID du panneau est requis"), // E.g., PNL-104
  title_panneau: z.string().min(1, "Le titre du panneau est requis"),
  title_project: z.string().min(1, "Le nom du projet est requis"),
  etat_construction: z.enum(['EN_CONSTRUCTION', 'EN_VALIDATION', 'KHM', 'TERMINE']).default('EN_CONSTRUCTION'),
  etat_validation: z.enum(['EN_ATTENTE', 'VALIDE', 'REJETE']).default('EN_ATTENTE'),
  etat_khm: z.enum(['EN_ATTENTE', 'CONFORME', 'NON_CONFORME']).default('EN_ATTENTE'),
  bom_id: z.coerce.number().int("L'ID du BOM est requis"),
  entrepot_id: z.coerce.number().int("L'ID de l'entrepôt doit être un entier").nullable().optional(),
  superviseur_id: z.string().min(1, "L'ID du superviseur est requis"),
});

const patchEtatSchema = z.object({
  etat_construction: z.enum(['EN_CONSTRUCTION', 'EN_VALIDATION', 'KHM', 'TERMINE']).optional(),
  etat_validation: z.enum(['EN_ATTENTE', 'VALIDE', 'REJETE']).optional(),
  etat_khm: z.enum(['EN_ATTENTE', 'CONFORME', 'NON_CONFORME']).optional(),
  reason: z.string().nullable().optional(),
});

const handleStockSortieForValidation = async (tx, panneauId, supervisorMatricule) => {
  const panneau = await tx.panneau.findUnique({
    where: { id: panneauId },
    include: {
      bom: {
        include: {
          lignes: { include: { article: true } }
        }
      }
    }
  });

  if (!panneau || !panneau.bom || !panneau.bom.lignes.length) return;

  const operations = panneau.bom.lignes.map(ligne => ({
    articleId: ligne.article_id,
    quantity: Math.ceil(ligne.quantite),
    matricule: supervisorMatricule || 'SYSTEM',
    panneauId: panneauId,
  }));

  await stockService.issueStockMultiLocationBulk(tx, operations);
};

// @desc    Get all panels (Kanban)
// @route   GET /panneaux
// @access  Private
const getPanneaux = async (req, res, next) => {
  try {
    const { project } = req.query;
    const where = {};

    if (project) {
      where.title_project = project;
    }

    const panneaux = await prisma.panneau.findMany({
      where,
      include: {
        bom: { 
          select: { 
            nom_bom: true, 
            nom_projet: true,
            lignes: {
              select: {
                quantite: true,
                article: {
                  select: {
                    nom_article: true,
                    quantite: true
                  }
                }
              }
            }
          } 
        },
        entrepot: { select: { nom: true } },
        superviseur: { select: { nom: true, matricule: true } }
      },
      orderBy: { id: 'asc' },
    });

    const formattedPanneaux = panneaux.map(p => {
      let composants = [];
      if (p.bom && p.bom.lignes) {
        composants = p.bom.lignes.map(l => ({
          nom: l.article.nom_article,
          requis: l.quantite,
          stock: l.article.quantite
        }));
      }
      return {
        ...p,
        composants,
        // Omit the full lignes array from the response if we only needed them for composants
        bom: { nom_bom: p.bom?.nom_bom, nom_projet: p.bom?.nom_projet } 
      };
    });

    res.json(formattedPanneaux);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single panel
// @route   GET /panneaux/:id
// @access  Private
const getPanneauById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const panneau = await prisma.panneau.findUnique({
      where: { id },
      include: {
        bom: {
          include: {
            lignes: {
              include: { article: { select: { nom_article: true, prix: true } } }
            }
          }
        },
        entrepot: { select: { nom: true, emplacement: true } },
        superviseur: { select: { nom: true, matricule: true, email: true } },
        khmControls: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!panneau) {
      return res.status(404).json({ error: "Panneau non trouvé" });
    }

    res.json(panneau);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a panel
// @route   POST /panneaux
// @access  Private (SUPERVISEUR, ADMIN)
const createPanneau = async (req, res, next) => {
  try {
    const { id, title_panneau, title_project, superviseur_id, priority = "NORMAL", planned_time } = req.body;
    // Coerce IDs to integers since form sends strings
    const bom_id = req.body.bom_id || null;
    const entrepot_id = req.body.entrepot_id || null;

    const payload = {
      id,
      title_panneau,
      title_project,
      etat_construction: 'EN_CONSTRUCTION',
      etat_validation: 'EN_ATTENTE',
      etat_khm: 'EN_ATTENTE',
      status: 'READY',
      priority,
      planned_time,
      bom_id,
      entrepot_id,
      superviseur_id,
    };
    
    // Quick validation ignoring some strict fields if we didn't update the Zod schema yet
    if (!id || !title_panneau || !title_project || !bom_id) {
      return res.status(400).json({ error: "Données requises manquantes" });
    }

    const exists = await prisma.panneau.findUnique({ where: { id } });
    if (exists) {
      return res.status(409).json({ error: `Le panneau avec l'ID '${id}' existe déjà` });
    }

    const bomExists = await prisma.bOM.findUnique({ where: { id: bom_id }, include: { lignes: true } });
    if (!bomExists) return res.status(400).json({ error: "BOM spécifiée introuvable" });

    if (entrepot_id) {
      const entrepotExists = await prisma.entrepot.findUnique({ where: { id: entrepot_id } });
      if (!entrepotExists) return res.status(400).json({ error: "Entrepôt spécifié introuvable" });
    }

    const supervisorExists = await prisma.user.findUnique({ where: { matricule: superviseur_id } });
    if (!supervisorExists) return res.status(400).json({ error: "Superviseur spécifié introuvable" });

    if (payload.etat_khm === 'CONFORME' && payload.etat_validation !== 'VALIDE') {
      return res.status(400).json({ error: "Le panneau doit d'abord être validé avant d'être marqué conforme KHM" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newPanneau = await tx.panneau.create({
        data: {
          ...payload,
          superviseur_id: supervisorExists.id,
        },
        include: {
          bom: { select: { nom_bom: true } },
          entrepot: { select: { nom: true } },
          superviseur: { select: { nom: true } }
        }
      });

      // 1. Production Timeline (Created Event)
      await tx.panneauTimeline.create({
        data: {
          panneau_id: id,
          event_type: 'CREATED',
          user_id: supervisorExists.id,
          timestamp: new Date()
        }
      });

      // Sync Machine creation
      await tx.machine.create({
        data: {
          nom: payload.title_panneau,
          code: payload.id,
          departement: payload.title_project,
          status: 'RUNNING'
        }
      });

      return newPanneau;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Update panel
// @route   PUT /panneaux/:id
// @access  Private (SUPERVISEUR, ADMIN)
const updatePanneau = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = panneauSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const existing = await prisma.panneau.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Panneau non trouvé" });
    }

    const data = { ...validation.data };

    // Resolve supervisor ID if a matricule was provided
    if (data.superviseur_id) {
      const supervisorExists = await prisma.user.findUnique({ where: { matricule: data.superviseur_id } });
      if (!supervisorExists) return res.status(400).json({ error: "Superviseur spécifié introuvable" });
      data.superviseur_id = supervisorExists.id;
    }

    if (data.bom_id) {
      const bomExists = await prisma.bOM.findUnique({ where: { id: data.bom_id } });
      if (!bomExists) return res.status(400).json({ error: "BOM spécifiée introuvable" });
    }

    if (data.entrepot_id) {
      const entrepotExists = await prisma.entrepot.findUnique({ where: { id: data.entrepot_id } });
      if (!entrepotExists) return res.status(400).json({ error: "Entrepôt spécifié introuvable" });
    }

    // Resolve validation status and KHM status to check the rule
    const finalValidation = data.etat_validation || existing.etat_validation;
    const finalKhm = data.etat_khm || existing.etat_khm;

    if (finalKhm === 'CONFORME' && finalValidation !== 'VALIDE') {
      return res.status(400).json({ error: "Le panneau doit d'abord être validé avant d'être marqué conforme KHM" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPanneau = await tx.panneau.update({
        where: { id },
        data,
        include: {
          bom: { select: { nom_bom: true } },
          entrepot: { select: { nom: true } },
          superviseur: { select: { nom: true, matricule: true } }
        }
      });

      // Sync Machine update
      if (data.title_panneau || data.title_project) {
        await tx.machine.updateMany({
          where: { code: id },
          data: {
            ...(data.title_panneau && { nom: data.title_panneau }),
            ...(data.title_project && { departement: data.title_project })
          }
        });
      }

      return updatedPanneau;
    }, { maxWait: 10000, timeout: 15000 });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete panel
// @route   DELETE /panneaux/:id
// @access  Private (SUPERVISEUR, ADMIN)
const deletePanneau = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.panneau.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Panneau non trouvé" });
    }

    // Sync Machine deletion
    await prisma.$transaction(async (tx) => {
      await tx.machine.deleteMany({ where: { code: id } });
      await tx.panneau.delete({ where: { id } });
    });
    res.json({ message: "Panneau supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};

const STAGES = ['EN_CONSTRUCTION', 'EN_VALIDATION', 'KHM', 'TERMINE'];

// @desc    Patch panel state (Kanban drag and drop or status trigger)
// @route   PATCH /panneaux/:id/etat
// @access  Private (SUPERVISEUR, ADMIN)
const patchEtat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = patchEtatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const existing = await prisma.panneau.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Panneau non trouvé" });
    }

    const { etat_construction, etat_validation, etat_khm, reason } = validation.data;
    const userRole = req.user?.role || 'SUPERVISEUR';
    const userId = req.user?.id;

    const data = {};
    if (etat_construction !== undefined) {
      data.etat_construction = etat_construction;
    }
    if (etat_validation !== undefined) {
      data.etat_validation = etat_validation;
    }
    if (etat_khm !== undefined) {
      data.etat_khm = etat_khm;
    }

    // Workflow Rules Verification for Kanban Drag & Drop
    let isStatusChange = false;
    let oldStatus = existing.etat_construction;
    let newStatus = data.etat_construction || oldStatus;

    if (etat_construction !== undefined && oldStatus !== newStatus) {
      isStatusChange = true;
      const currentIndex = STAGES.indexOf(oldStatus);
      const newIndex = STAGES.indexOf(newStatus);

      if (currentIndex === -1 || newIndex === -1) {
         return res.status(400).json({ error: "Statut invalide" });
      }

      // Check if it's a standard forward move (+1 step)
      const isSequential = newIndex === currentIndex + 1;
      
      if (!isSequential) {
        // Only ADMIN can perform non-sequential or backward moves
        if (userRole !== 'ADMIN') {
          return res.status(403).json({ error: "Seul un administrateur peut forcer ce changement de statut." });
        }
        if (!reason || reason.trim() === '') {
          return res.status(400).json({ error: "Un motif (reason) est obligatoire pour forcer ce changement de statut." });
        }
      }
    }

    // Rule: etat_khm ne peut passer à "Conforme" que si etat_validation = "Validé"
    const finalValidation = data.etat_validation !== undefined ? data.etat_validation : existing.etat_validation;
    const finalKhm = data.etat_khm !== undefined ? data.etat_khm : existing.etat_khm;

    if (finalKhm === 'CONFORME' && finalValidation !== 'VALIDE') {
      return res.status(400).json({ error: "Le panneau doit d'abord être validé avant d'être marqué conforme KHM" });
    }

    let historyRecord = null;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPanneau = await tx.panneau.update({
        where: { id },
        data,
        include: {
          bom: { select: { nom_bom: true } },
          superviseur: { select: { nom: true, matricule: true } }
        }
      });

      if (isStatusChange) {
         historyRecord = await tx.panneauHistory.create({
           data: {
             panneau_id: id,
             user_id: userId,
             action: 'STATE_CHANGE',
             previous_state: oldStatus,
             new_state: newStatus,
             notes: reason || 'Changement de statut standard',
           }
         });
      }

      // Trigger stock logic if passing into validation
      if (oldStatus === 'EN_CONSTRUCTION' && newStatus === 'EN_VALIDATION') {
        // Idempotency check: verify stock hasn't already been deducted for this panel
        const existingMovements = await tx.mouvementStock.findFirst({
          where: {
            panneau_id: id,
            type: 'SORTIE'
          }
        });

        if (!existingMovements) {
          await handleStockSortieForValidation(tx, id, updatedPanneau.superviseur?.matricule);
        }
      }

      // AUTO-CREATE KhmControl when panel enters the KHM stage
      // This is what makes the panel appear in the "Contrôle KHM" page
      if (isStatusChange && newStatus === 'KHM') {
        // Entering KHM means the panel has passed validation
        await tx.panneau.update({
          where: { id },
          data: { etat_validation: 'VALIDE' }
        });

        // Delete any stale pending KHM controls first (idempotent)
        await tx.khmControl.deleteMany({
          where: { panneau_id: id, etat: 'EN_ATTENTE' }
        });
        // Create fresh control entry for the inspector
        await tx.khmControl.create({
          data: {
            panneau_id: id,
            etat: 'EN_ATTENTE',
            matricule_superviseur: updatedPanneau.superviseur?.matricule || req.user?.matricule || 'SYSTEM',
            commentaire: null,
          }
        });
        // Also reset the panel's etat_khm to EN_ATTENTE for a clean inspection
        await tx.panneau.update({
          where: { id },
          data: { etat_khm: 'EN_ATTENTE' }
        });
      }

      // If panel is moved AWAY from KHM backward (admin override), remove pending control
      if (isStatusChange && oldStatus === 'KHM' && newStatus !== 'TERMINE') {
        await tx.khmControl.deleteMany({
          where: { panneau_id: id, etat: 'EN_ATTENTE' }
        });
      }

      return updatedPanneau;
    }, { maxWait: 20000, timeout: 60000 });

    res.json({ message: 'Success', panneau: updated, history: historyRecord });
  } catch (error) {
    next(error);
  }
};

// @desc    Get panel status history
// @route   GET /panneaux/:id/history
// @access  Private
const getPanneauHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await prisma.panneauHistory.findMany({
      where: { panneau_id: id },
      include: {
        user: { select: { nom: true, matricule: true } }
      },
      orderBy: { timestamp: 'desc' }
    });

    const formatted = history.map(h => ({
      id: h.id,
      action: h.action,
      previous_state: h.previous_state,
      new_state: h.new_state,
      notes: h.notes,
      commentaire: h.notes,
      user_name: h.user ? `${h.user.nom} (${h.user.matricule})` : 'Système',
      date: h.timestamp,
      timestamp: h.timestamp
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPanneaux,
  getPanneauById,
  getPanneauHistory,
  createPanneau,
  updatePanneau,
  deletePanneau,
  patchEtat,
};
