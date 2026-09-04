const { z } = require('zod');
const prisma = require('../config/db');
const { transitionOrganigramme, cloneOrganigramme } = require('../services/organigrammeWorkflowService');
const { validateOrgSnapshot } = require('../services/organigrammeValidationService');
const { AppError } = require('../helpers/AppError');

// ── Zod Schemas ─────────────────────────────────────────────────────────────────

const createOrganigrammeSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional().nullable(),
  snapshot: z.string().min(1, "Le snapshot de l'organigramme est requis"),
});

const updateOrganigrammeSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").optional(),
  description: z.string().optional().nullable(),
  snapshot: z.string().min(1, "Le snapshot est requis").optional(),
});

const commentSchema = z.object({
  comment: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable() // For concurrency control
});

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, "Le motif de rejet est requis"),
  comment: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable()
});

// ── Controllers ─────────────────────────────────────────────────────────────────

// @desc    Get all organigrammes
// @route   GET /organigrammes
const getOrganigrammes = async (req, res, next) => {
  try {
    const organigrammes = await prisma.organigramme.findMany({
      include: {
        creator: { select: { id: true, nom: true, matricule: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(organigrammes.map(async (org) => {
      let lastRejection = null;
      if (org.statut === 'REJETE') {
        lastRejection = await prisma.organigrammeHistory.findFirst({
          where: { organigramme_id: org.id, new_status: 'REJETE' },
          orderBy: { timestamp: 'desc' },
          select: { rejection_reason: true, comment: true, timestamp: true },
        });
      }
      return { ...org, lastRejection };
    }));

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single organigramme
// @route   GET /organigrammes/:id
const getOrganigrammeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organigramme = await prisma.organigramme.findUnique({
      where: { id: id },
      include: {
        creator: { select: { id: true, nom: true, matricule: true, role: true } },
        history: {
          include: { user: { select: { id: true, nom: true, matricule: true } } },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!organigramme) {
      return res.status(404).json({ error: "Organigramme non trouvé" });
    }

    let lastRejection = null;
    if (organigramme.statut === 'REJETE') {
      lastRejection = organigramme.history.find(h => h.new_status === 'REJETE') || null;
    }

    res.json({ ...organigramme, lastRejection });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the currently active (VALIDE) organigramme
// @route   GET /organigrammes/active
const getActiveOrganigramme = async (req, res, next) => {
  try {
    const active = await prisma.organigramme.findFirst({
      where: { statut: 'VALIDE' },
      include: {
        creator: { select: { id: true, nom: true, matricule: true, role: true } },
      },
      orderBy: { version: 'desc' },
    });

    if (!active) {
      return res.status(404).json({ error: "Aucun organigramme actif trouvé" });
    }

    res.json(active);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new organigramme (draft)
// @route   POST /organigrammes
const createOrganigramme = async (req, res, next) => {
  try {
    const validation = createOrganigrammeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { titre, description, snapshot } = validation.data;

    const organigramme = await prisma.$transaction(async (tx) => {
      const maxVersion = await tx.organigramme.aggregate({ _max: { version: true } });
      const newVersion = (maxVersion._max.version || 0) + 1;

      const org = await tx.organigramme.create({
        data: {
          titre,
          description,
          snapshot,
          statut: 'BROUILLON',
          version: newVersion,
          createdBy: req.user.id,
        },
        include: {
          creator: { select: { id: true, nom: true, matricule: true, role: true } },
        },
      });

      await tx.organigrammeHistory.create({
        data: {
          organigramme_id: org.id,
          previous_status: '',
          new_status: 'BROUILLON',
          user_id: req.user.id,
          comment: 'Création du brouillon',
        },
      });

      return org;
    });

    res.status(201).json(organigramme);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a BROUILLON organigramme
// @route   PUT /organigrammes/:id
const updateOrganigramme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = updateOrganigrammeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const existing = await prisma.organigramme.findUnique({ where: { id: id } });
    if (!existing) return res.status(404).json({ error: "Organigramme non trouvé" });

    if (existing.statut !== 'BROUILLON') {
      return res.status(400).json({ error: "Seul un organigramme en brouillon peut être modifié" });
    }

    if (req.body.updatedAt && new Date(req.body.updatedAt).getTime() !== existing.updatedAt.getTime()) {
      return res.status(409).json({ error: "L'organigramme a été modifié par un autre utilisateur." });
    }

    const updated = await prisma.organigramme.update({
      where: { id: id },
      data: validation.data,
      include: {
        creator: { select: { id: true, nom: true, matricule: true, role: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ── Workflow Transition Endpoints ───────────────────────────────────────────────

const submitOrganigramme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = commentSchema.parse(req.body || {});
    
    // Check validation of snapshot before submitting
    const org = await prisma.organigramme.findUnique({ where: { id: id } });
    if (!org) return res.status(404).json({ error: "Organigramme non trouvé" });
    
    if (!org.snapshot || org.snapshot === '{}' || org.snapshot === '[]') {
      return res.status(400).json({ error: "L'organigramme doit contenir un snapshot valide." });
    }

    try {
      const tree = JSON.parse(org.snapshot);
      await validateOrgSnapshot(tree, prisma);
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError("Le format du snapshot est invalide", 400, "INVALID_JSON");
    }

    const updated = await transitionOrganigramme(id, 'submit', req.user, prisma, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const validateOrganigramme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = commentSchema.parse(req.body || {});
    const updated = await transitionOrganigramme(id, 'validate', req.user, prisma, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const rejectOrganigramme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = rejectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }
    const updated = await transitionOrganigramme(id, 'reject', req.user, prisma, {
      comment: validation.data.comment,
      rejectionReason: validation.data.rejection_reason,
      updatedAt: validation.data.updatedAt
    });
    res.json({ ...updated, lastRejection: { rejection_reason: validation.data.rejection_reason, comment: validation.data.comment, timestamp: new Date() } });
  } catch (error) {
    next(error);
  }
};

const resubmitOrganigramme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = commentSchema.parse(req.body || {});
    
    // Check validation before resubmit
    const org = await prisma.organigramme.findUnique({ where: { id: id } });
    if (!org) return res.status(404).json({ error: "Organigramme non trouvé" });
    try {
      const tree = JSON.parse(org.snapshot);
      await validateOrgSnapshot(tree, prisma);
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError("Le format du snapshot est invalide", 400, "INVALID_JSON");
    }

    const updated = await transitionOrganigramme(id, 'resubmit', req.user, prisma, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const archiveOrganigramme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = commentSchema.parse(req.body || {});
    const updated = await transitionOrganigramme(id, 'archive', req.user, prisma, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const getOrganigrammeHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await prisma.organigrammeHistory.findMany({
      where: { organigramme_id: id },
      include: { user: { select: { id: true, nom: true, matricule: true } } },
      orderBy: { timestamp: 'desc' },
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Clone a VALIDE organigramme into a new BROUILLON
// @route   POST /organigrammes/:id/clone
const cloneOrganigrammeEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cloned = await cloneOrganigramme(id, req.user, prisma);
    res.status(201).json(cloned);
  } catch (error) {
    next(error);
  }
};

// @desc    Validate an organigramme tree snapshot
// @route   POST /organigrammes/validate-tree
const validateHierarchy = async (req, res, next) => {
  try {
    const { snapshot } = req.body;
    if (!snapshot) return res.status(400).json({ error: "Snapshot requis" });
    
    let tree;
    try {
      tree = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
    } catch (e) {
      return res.status(400).json({ error: "JSON invalide" });
    }
    
    await validateOrgSnapshot(tree, prisma);
    res.json({ success: true, message: "L'organigramme est valide" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganigrammes,
  getOrganigrammeById,
  getActiveOrganigramme,
  createOrganigramme,
  updateOrganigramme,
  submitOrganigramme,
  validateOrganigramme,
  rejectOrganigramme,
  resubmitOrganigramme,
  archiveOrganigramme,
  getOrganigrammeHistory,
  cloneOrganigrammeEndpoint,
  validateHierarchy
};
