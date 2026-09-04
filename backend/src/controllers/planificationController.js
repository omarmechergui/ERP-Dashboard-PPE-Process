const { z } = require('zod');
const prisma = require('../config/db');

const planificationSchema = z.object({
  title: z.string().min(1, "Le titre de la planification est requis"),
  project: z.string().optional().nullable(),
  customer: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  date_debut: z.string().transform(str => new Date(str)),
  date_fin: z.string().transform(str => new Date(str)),
  matricule_gl: z.string().min(1, "Le matricule du GL est requis"),
  matricule_superviseur: z.string().min(1, "Le matricule du superviseur est requis"),
  progress: z.number().min(0).max(100).multipleOf(10).optional().default(0),
});

const getDashboardStats = async (req, res, next) => {
  try {
    const planifications = await prisma.planification.findMany({
      include: {
        panneaux: { select: { etat_construction: true } }
      }
    });

    const now = new Date();
    
    let totalActive = 0;
    let inProduction = 0;
    let completed = 0;
    let delayed = 0;
    let globalProgressSum = 0;

    const statusCounts = { BROUILLON: 0, PLANIFIE: 0, EN_PRODUCTION: 0, TERMINE: 0, ANNULE: 0 };
    const timelineData = [];

    for (const plan of planifications) {
      if (plan.status !== 'ANNULE') {
        totalActive++;
        globalProgressSum += plan.progress;
      }
      
      if (plan.status === 'EN_PRODUCTION') inProduction++;
      if (plan.status === 'TERMINE') completed++;
      if (plan.status !== 'TERMINE' && plan.status !== 'ANNULE' && new Date(plan.date_fin) < now) {
        delayed++;
      }

      if (statusCounts[plan.status] !== undefined) {
        statusCounts[plan.status]++;
      }

      timelineData.push({
        id: plan.id,
        title: plan.title,
        date_debut: plan.date_debut,
        date_fin: plan.date_fin,
        progress: plan.progress,
        status: plan.status
      });
    }

    const globalProgress = totalActive > 0 ? parseFloat((globalProgressSum / totalActive).toFixed(2)) : 0;

    res.json({
      stats: {
        totalActive,
        inProduction,
        completed,
        delayed,
        globalProgress
      },
      statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      timeline: timelineData.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
    });
  } catch (error) {
    next(error);
  }
};

const getPlanifications = async (req, res, next) => {
  try {
    const planifications = await prisma.planification.findMany({
      include: {
        gl: { select: { nom: true, email: true } },
        superviseur: { select: { nom: true, email: true } },
        panneaux: { select: { id: true, etat_construction: true } }
      },
      orderBy: { date_debut: 'asc' },
    });

    // Auto calculate delayed status before sending
    const enhanced = planifications.map(p => ({
      ...p,
      isDelayed: p.status !== 'TERMINE' && p.status !== 'ANNULE' && new Date(p.date_fin) < new Date()
    }));

    res.json(enhanced);
  } catch (error) {
    next(error);
  }
};

const getPlanificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const planification = await prisma.planification.findUnique({
      where: { id: id },
      include: {
        gl: { select: { nom: true, email: true } },
        superviseur: { select: { nom: true, email: true } },
        panneaux: true
      }
    });

    if (!planification) {
      return res.status(404).json({ error: "Planification non trouvée" });
    }

    planification.isDelayed = planification.status !== 'TERMINE' && planification.status !== 'ANNULE' && new Date(planification.date_fin) < new Date();

    res.json(planification);
  } catch (error) {
    next(error);
  }
};

const createPlanification = async (req, res, next) => {
  try {
    const validation = planificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { title, project, customer, priority, date_debut, date_fin, matricule_gl, matricule_superviseur, progress } = validation.data;

    const glUser = await prisma.user.findUnique({ where: { matricule: matricule_gl } });
    if (!glUser) return res.status(400).json({ error: `GL avec le matricule '${matricule_gl}' introuvable` });

    const supervisorUser = await prisma.user.findUnique({ where: { matricule: matricule_superviseur } });
    if (!supervisorUser) return res.status(400).json({ error: `Superviseur avec le matricule '${matricule_superviseur}' introuvable` });

    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.planification.create({
        data: {
          title,
          project,
          customer,
          priority,
          date_debut,
          date_fin,
          matricule_gl,
          matricule_superviseur,
          status: 'BROUILLON',
          progress: progress || 0,
        },
        include: {
          gl: { select: { nom: true } },
          superviseur: { select: { nom: true } }
        }
      });

      await tx.planificationHistory.create({
        data: {
          planification_id: plan.id,
          user_id: req.user.id,
          action: 'CREATE',
          newValue: JSON.stringify({ title, project, customer, priority, progress: progress || 0 }),
          description: `Planification "${title}" créée`
        }
      });

      return plan;
    });

    res.status(201).json(newPlan);
  } catch (error) {
    next(error);
  }
};

const updatePlanification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = planificationSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const existingPlan = await prisma.planification.findUnique({ where: { id: id } });
    if (!existingPlan) return res.status(404).json({ error: "Planification non trouvée" });

    const updateData = validation.data;

    if (updateData.matricule_gl) {
      const glUser = await prisma.user.findUnique({ where: { matricule: updateData.matricule_gl } });
      if (!glUser) return res.status(400).json({ error: `GL avec le matricule '${updateData.matricule_gl}' introuvable` });
    }

    if (updateData.matricule_superviseur) {
      const supervisorUser = await prisma.user.findUnique({ where: { matricule: updateData.matricule_superviseur } });
      if (!supervisorUser) return res.status(400).json({ error: `Superviseur avec le matricule '${updateData.matricule_superviseur}' introuvable` });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const plan = await tx.planification.update({
        where: { id: id },
        data: updateData,
        include: {
          gl: { select: { nom: true } },
          superviseur: { select: { nom: true } }
        }
      });

      // Detect progression change
      if (updateData.progress !== undefined && updateData.progress !== existingPlan.progress) {
        await tx.planificationHistory.create({
          data: {
            planification_id: plan.id,
            user_id: req.user.id,
            action: 'PROGRESSION_CHANGE',
            oldValue: `${existingPlan.progress}%`,
            newValue: `${updateData.progress}%`,
            description: `Progression modifiée de ${existingPlan.progress}% à ${updateData.progress}%`
          }
        });
      }

      // Build a summary of other changed fields (exclude progress, already handled)
      const changedFields = [];
      const fieldLabels = {
        title: 'Titre', project: 'Projet', customer: 'Client',
        priority: 'Priorité', date_debut: 'Date début', date_fin: 'Date fin',
        matricule_gl: 'GL', matricule_superviseur: 'Superviseur'
      };

      for (const key of Object.keys(fieldLabels)) {
        if (updateData[key] !== undefined) {
          const oldVal = existingPlan[key];
          const newVal = updateData[key];
          // Compare as strings (dates become ISO strings)
          if (String(oldVal) !== String(newVal)) {
            changedFields.push(fieldLabels[key]);
          }
        }
      }

      if (changedFields.length > 0) {
        await tx.planificationHistory.create({
          data: {
            planification_id: plan.id,
            user_id: req.user.id,
            action: 'UPDATE',
            oldValue: JSON.stringify(
              Object.fromEntries(
                Object.keys(fieldLabels)
                  .filter(k => updateData[k] !== undefined && String(existingPlan[k]) !== String(updateData[k]))
                  .map(k => [k, existingPlan[k]])
              )
            ),
            newValue: JSON.stringify(
              Object.fromEntries(
                Object.keys(fieldLabels)
                  .filter(k => updateData[k] !== undefined && String(existingPlan[k]) !== String(updateData[k]))
                  .map(k => [k, updateData[k]])
              )
            ),
            description: `Champs modifiés : ${changedFields.join(', ')}`
          }
        });
      }

      return plan;
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const updatePlanificationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['BROUILLON', 'PLANIFIE', 'EN_PRODUCTION', 'TERMINE', 'ANNULE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const existingPlan = await prisma.planification.findUnique({ where: { id: id } });
    if (!existingPlan) return res.status(404).json({ error: "Planification non trouvée" });

    const updated = await prisma.$transaction(async (tx) => {
      const plan = await tx.planification.update({
        where: { id: id },
        data: { status },
        include: { panneaux: true }
      });

      await tx.planificationHistory.create({
        data: {
          planification_id: plan.id,
          user_id: req.user.id,
          action: 'STATUS_CHANGE',
          oldValue: existingPlan.status,
          newValue: status,
          description: notes || `Statut modifié de ${existingPlan.status} à ${status}`
        }
      });

      return plan;
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const getPlanificationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await prisma.planificationHistory.findMany({
      where: { planification_id: id },
      include: { user: { select: { nom: true, matricule: true } } },
      orderBy: { timestamp: 'desc' }
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

const getPlanificationPanneaux = async (req, res, next) => {
  try {
    const { id } = req.params;
    const panneaux = await prisma.panneau.findMany({
      where: { planification_id: id },
      include: {
        superviseur: { select: { nom: true } }
      }
    });
    res.json(panneaux);
  } catch (error) {
    next(error);
  }
};

const deletePlanification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingPlan = await prisma.planification.findUnique({ where: { id: id } });
    if (!existingPlan) return res.status(404).json({ error: "Planification non trouvée" });

    // Log delete history BEFORE deleting (relation will be set to null via onDelete: SetNull)
    await prisma.planificationHistory.create({
      data: {
        planification_id: id,
        user_id: req.user.id,
        action: 'DELETE',
        oldValue: JSON.stringify({ title: existingPlan.title, project: existingPlan.project, status: existingPlan.status }),
        description: `Planification "${existingPlan.title}" supprimée`
      }
    });

    await prisma.planification.delete({ where: { id: id } });
    res.json({ message: "Planification supprimée avec succès" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getPlanifications,
  getPlanificationById,
  getPlanificationPanneaux,
  getPlanificationHistory,
  createPlanification,
  updatePlanification,
  updatePlanificationStatus,
  deletePlanification,
};
