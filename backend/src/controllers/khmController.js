const { z } = require('zod');
const prisma = require('../config/db');

const khmCreateSchema = z.object({
  panneau_id: z.string().min(1, "L'ID du panneau est requis"),
  etat: z.enum(['EN_ATTENTE', 'CONFORME', 'NON_CONFORME']).default('EN_ATTENTE'),
  matricule_superviseur: z.string().min(1, "Le matricule du superviseur est requis"),
  commentaire: z.string().optional().nullable(),
});

// @desc    Get all KHM controls
// @route   GET /khm
// @access  Private
const getKhmControls = async (req, res, next) => {
  try {
    const { all } = req.query;
    // By default only return EN_ATTENTE controls (pending inspection)
    // Pass ?all=true to get all historical records
    const where = all === 'true' ? {} : { etat: 'EN_ATTENTE' };

    const controls = await prisma.khmControl.findMany({
      where,
      include: {
        panneau: {
          select: {
            title_panneau: true,
            title_project: true,
            etat_construction: true,
            etat_validation: true,
            etat_khm: true,
            superviseur: { select: { nom: true, matricule: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(controls);
  } catch (error) {
    next(error);
  }
};

// @desc    Sync: create KhmControl entries for panels already in KHM stage (backfill for existing data)
// @route   POST /khm/sync
// @access  Private (ADMIN only)
const syncKhmControls = async (req, res, next) => {
  try {
    // Find all panels at KHM stage with no pending EN_ATTENTE control record
    const khmPanneaux = await prisma.panneau.findMany({
      where: { etat_construction: 'KHM' },
      include: {
        khmControls: { where: { etat: 'EN_ATTENTE' } },
        superviseur: { select: { matricule: true } }
      }
    });

    const created = [];
    for (const panneau of khmPanneaux) {
      // Auto-fix old data that reached KHM stage before the workflow fix
      if (panneau.etat_validation !== 'VALIDE') {
        await prisma.panneau.update({
          where: { id: panneau.id },
          data: { etat_validation: 'VALIDE' }
        });
      }

      if (panneau.khmControls.length === 0) {
        const ctrl = await prisma.khmControl.create({
          data: {
            panneau_id: panneau.id,
            etat: 'EN_ATTENTE',
            matricule_superviseur: panneau.superviseur?.matricule || 'SYSTEM',
            commentaire: null,
          }
        });
        created.push(ctrl);
      }
    }

    res.json({
      message: `Sync complete. ${created.length} control(s) created.`,
      created
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single KHM control
// @route   GET /khm/:id
// @access  Private
const getKhmControlById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const control = await prisma.khmControl.findUnique({
      where: { id: id },
      include: {
        panneau: true
      }
    });

    if (!control) {
      return res.status(404).json({ error: "Contrôle KHM non trouvé" });
    }

    res.json(control);
  } catch (error) {
    next(error);
  }
};

// @desc    Create KHM control
// @route   POST /khm
// @access  Private (SUPERVISEUR, ADMIN)
const createKhmControl = async (req, res, next) => {
  try {
    const validation = khmCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { panneau_id, etat, matricule_superviseur, commentaire } = validation.data;

    // Verify panel exists
    const panel = await prisma.panneau.findUnique({ where: { id: panneau_id } });
    if (!panel) return res.status(404).json({ error: "Panneau spécifié introuvable" });

    // Enforce KHM rule: cannot mark conforming if panel is not validated
    if (etat === 'CONFORME' && panel.etat_validation !== 'VALIDE') {
      return res.status(400).json({ error: "Le panneau doit être 'Validé' avant de pouvoir être conforme KHM" });
    }

    const control = await prisma.khmControl.create({
      data: { panneau_id, etat, matricule_superviseur, commentaire },
    });

    // Update panel KHM status
    await prisma.panneau.update({
      where: { id: panneau_id },
      data: { etat_khm: etat }
    });

    res.status(201).json(control);
  } catch (error) {
    next(error);
  }
};

// @desc    Validate KHM (Conforme)
// @route   PATCH /khm/:id/valider
// @access  Private (SUPERVISEUR, ADMIN)
const validerKhm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    const control = await prisma.khmControl.findUnique({
      where: { id: id },
      include: { panneau: true }
    });

    if (!control) {
      return res.status(404).json({ error: "Contrôle KHM non trouvé" });
    }

    // Panel validation constraint: panel must be validated
    if (control.panneau.etat_validation !== 'VALIDE') {
      return res.status(400).json({ error: "Le panneau doit d'abord être validé avant d'être marqué conforme KHM" });
    }

    // Use transaction to update control, panel, and record history
    const updatedControl = await prisma.$transaction(async (tx) => {
      const updated = await tx.khmControl.update({
        where: { id: id },
        data: {
          etat: 'CONFORME',
          commentaire: commentaire || control.commentaire,
          matricule_superviseur: req.user.matricule
        }
      });

      await tx.panneau.update({
        where: { id: control.panneau_id },
        data: {
          etat_khm: 'CONFORME',
          etat_construction: 'TERMINE'
        }
      });

      await tx.panneauHistory.create({
        data: {
          panneau_id: control.panneau_id,
          user_id: req.user.id,
          action: 'KHM_VALIDATION',
          previous_state: control.panneau.etat_construction,
          new_state: 'TERMINE',
          notes: commentaire || 'Validation KHM: Conforme'
        }
      });

      return updated;
    });

    res.json(updatedControl);
  } catch (error) {
    next(error);
  }
};

// @desc    Reject KHM (Non conforme)
// @route   PATCH /khm/:id/rejeter
// @access  Private (SUPERVISEUR, ADMIN)
const rejeterKhm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    if (!commentaire || commentaire.trim() === '') {
      return res.status(400).json({ error: "Un commentaire de rejet est requis pour expliquer la non-conformité" });
    }

    const control = await prisma.khmControl.findUnique({
      where: { id: id },
      include: { panneau: true }
    });

    if (!control) {
      return res.status(404).json({ error: "Contrôle KHM non trouvé" });
    }

    // Use transaction to update control, panel, and record history
    const updatedControl = await prisma.$transaction(async (tx) => {
      const updated = await tx.khmControl.update({
        where: { id: id },
        data: {
          etat: 'NON_CONFORME',
          commentaire,
          matricule_superviseur: req.user.matricule
        }
      });

      await tx.panneau.update({
        where: { id: control.panneau_id },
        data: {
          etat_khm: 'NON_CONFORME',
          etat_construction: 'EN_CONSTRUCTION'
        }
      });

      await tx.panneauHistory.create({
        data: {
          panneau_id: control.panneau_id,
          user_id: req.user.id,
          action: 'KHM_REJECTION',
          previous_state: control.panneau.etat_construction,
          new_state: 'EN_CONSTRUCTION',
          notes: commentaire
        }
      });

      return updated;
    });

    res.json(updatedControl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKhmControls,
  getKhmControlById,
  syncKhmControls,
  createKhmControl,
  validerKhm,
  rejeterKhm,
};
