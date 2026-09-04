const prisma = require('../config/db');
const { getSharedMaintenanceKpis } = require('../services/maintenanceKpiService');
const { TECHNICIEN_ROLES } = require('../helpers/stockHelpers');
const stockService = require('../services/stock/stockService');

// @desc    Get Maintenance KPIs
// @route   GET /maintenance/kpis
// @access  Private
const getKpis = async (req, res, next) => {
  try {
    const kpiData = await getSharedMaintenanceKpis();

    res.json({
      success: true,
      data: kpiData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all interventions
// @route   GET /maintenance/interventions
// @access  Private
const getInterventions = async (req, res, next) => {
  try {
    const { status, type, priority, machineId, technicienId } = req.query;
    const where = {};
    if (status && status !== 'Tous') where.status = status;
    if (type && type !== 'Tous') where.type = type;
    if (priority && priority !== 'Tous') where.priority = priority;
    if (machineId) where.machineId = machineId;
    if (technicienId) where.technicienId = technicienId;

    const interventions = await prisma.intervention.findMany({
      where,
      include: {
        machine: true,
        technicien: true,
        preventivePlan: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Convert to frontend expected shape
    const formatted = interventions.map(int => ({
      id: int.id,
      code: int.code,
      title: int.title,
      description: int.description,
      machine: int.machine ? { id: int.machine.id, nom: int.machine.nom, code: int.machine.code } : null,
      machineId: int.machineId,
      technicien: int.technicien ? { id: int.technicien.id, nom: int.technicien.nom } : null,
      technicienId: int.technicienId,
      preventivePlanId: int.preventivePlanId,
      preventivePlan: int.preventivePlan ? { id: int.preventivePlan.id, code: int.preventivePlan.code } : null,
      type: int.type,
      priority: int.priority,
      status: int.status,
      shift: int.shift,
      plannedStart: int.plannedStart,
      plannedEnd: int.plannedEnd,
      actualStart: int.actualStart,
      actualEnd: int.actualEnd,
      cause: int.cause,
      action: int.action,
      result: int.result,
      observations: int.observations,
      interventionDuration: int.interventionDuration,
      createdAt: int.createdAt,
      updatedAt: int.updatedAt,
      // legacy fields
      defaut: int.defaut,
      startDate: int.startDate,
      endDate: int.endDate,
      downtime: int.downtime
    }));

    res.json({
      success: true,
      data: {
        interventions: formatted,
        timeline: formatted.map(int => ({
           id: int.id, code: int.code, 
           gridCells: Array(7).fill(false).map((_, i) => i === new Date(int.createdAt).getDay()), 
           color: (int.status === 'TERMINÉE' || int.status === 'Clôturée') ? 'success' : (int.status === 'EN_COURS' || int.status === 'En cours') ? 'warning' : 'danger'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get intervention by ID
// @route   GET /maintenance/interventions/:id
// @access  Private
const getInterventionById = async (req, res, next) => {
  try {
    const intervention = await prisma.intervention.findUnique({
      where: { id: req.params.id },
      include: {
        machine: true,
        technicien: true,
        preventivePlan: true,
        parts: {
          include: {
            article: true
          }
        }
      }
    });

    if (!intervention) {
      return res.status(404).json({ success: false, error: 'Intervention not found' });
    }

    const formatted = {
      id: intervention.id,
      code: intervention.code,
      title: intervention.title,
      description: intervention.description,
      machine: intervention.machine ? { id: intervention.machine.id, nom: intervention.machine.nom, code: intervention.machine.code } : null,
      machineId: intervention.machineId,
      technicien: intervention.technicien ? { id: intervention.technicien.id, nom: intervention.technicien.nom } : null,
      technicienId: intervention.technicienId,
      preventivePlanId: intervention.preventivePlanId,
      preventivePlan: intervention.preventivePlan ? { id: intervention.preventivePlan.id, code: intervention.preventivePlan.code } : null,
      type: intervention.type,
      priority: intervention.priority,
      status: intervention.status,
      shift: intervention.shift,
      plannedStart: intervention.plannedStart,
      plannedEnd: intervention.plannedEnd,
      actualStart: intervention.actualStart,
      actualEnd: intervention.actualEnd,
      cause: intervention.cause,
      action: intervention.action,
      result: intervention.result,
      observations: intervention.observations,
      interventionDuration: intervention.interventionDuration,
      parts: intervention.parts.map(p => ({
        id: p.id,
        articleId: p.articleId,
        quantite: p.quantite,
        nom_article: p.article.nom_article,
        createdAt: p.createdAt
      })),
      createdAt: intervention.createdAt,
      updatedAt: intervention.updatedAt,
      // legacy fields
      defaut: intervention.defaut,
      startDate: intervention.startDate,
      endDate: intervention.endDate,
      downtime: intervention.downtime
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Create intervention
// @route   POST /maintenance/interventions
// @access  Private
const createIntervention = async (req, res, next) => {
  try {
    const { 
      title, description, defaut, type, priority, status, shift, action, 
      machineId, technicienId, preventivePlanId, downtime, 
      plannedStart, plannedEnd, startDate, endDate 
    } = req.body;
    
    const finalDescription = description || defaut || '';
    if (!finalDescription.trim()) {
      return res.status(400).json({ success: false, error: 'Le champ "Description" ou "Panne / Constat" est obligatoire.' });
    }

    let validTechnicienId = null;
    if (technicienId) {
      const technicien = await prisma.user.findUnique({
        where: { id: technicienId }
      });

      if (!technicien) {
        return res.status(400).json({ success: false, error: "Le technicien assigné n'existe pas." });
      }
      
      if (!TECHNICIEN_ROLES.includes(technicien.role)) {
        return res.status(400).json({ success: false, error: "L'utilisateur assigné n'a pas le rôle de technicien." });
      }

      if (technicien.statut === 'INACTIF') {
        return res.status(400).json({ success: false, error: "Le technicien assigné est inactif." });
      }
      
      validTechnicienId = technicienId;
    }

    // Generate a unique code server-side
    const { nextSeq } = require('../helpers/counterHelper');
    const nextNum = await nextSeq(prisma, 'intervention');
    const code = `INT-${String(nextNum).padStart(5, '0')}`;

    const initialStatus = status || 'PLANIFIÉE'; // default CMMS status

    const intervention = await prisma.intervention.create({
      data: {
        code,
        title: title || `Intervention sur ${machineId}`,
        description: finalDescription.trim(),
        defaut: finalDescription.trim(), // keep for legacy
        type: type || 'Corrective',
        priority: priority || 'Normal',
        status: initialStatus,
        shift: shift || null,
        action: action || null,
        machineId: machineId ? machineId : null,
        technicienId: validTechnicienId,
        preventivePlanId: preventivePlanId ? preventivePlanId : null,
        downtime: downtime !== undefined && downtime !== null && downtime !== '' ? parseFloat(downtime) : null,
        plannedStart: plannedStart ? new Date(plannedStart) : (startDate ? new Date(startDate) : null),
        plannedEnd: plannedEnd ? new Date(plannedEnd) : (endDate ? new Date(endDate) : null),
        startDate: startDate ? new Date(startDate) : null, // legacy
        endDate: endDate ? new Date(endDate) : null // legacy
      }
    });

    res.status(201).json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

// Helper for downtime calculation
const calculateDowntime = (startDate, endDate) => {
  if (startDate && endDate) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    if (eDate >= sDate) {
      return parseFloat(((eDate - sDate) / (1000 * 60 * 60)).toFixed(2));
    }
  }
  return null;
};

// @desc    Update intervention
// @route   PUT /maintenance/interventions/:id
// @access  Private
const updateIntervention = async (req, res, next) => {
  try {
    const { 
      title, description, defaut, type, priority, status, shift, action, 
      machineId, technicienId, downtime, plannedStart, plannedEnd, 
      cause, result, observations 
    } = req.body;
    
    const finalDescription = description !== undefined ? description : defaut;
    if (finalDescription !== undefined && (!finalDescription || finalDescription.trim() === '')) {
      return res.status(400).json({ success: false, error: 'Le champ "Description" est obligatoire.' });
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (finalDescription !== undefined) {
      data.description = finalDescription.trim();
      data.defaut = finalDescription.trim();
    }
    if (type !== undefined) data.type = type;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) data.status = status;
    if (shift !== undefined) data.shift = shift || null;
    if (action !== undefined) data.action = action || null;
    if (machineId !== undefined) data.machineId = machineId ? machineId : null;
    if (cause !== undefined) data.cause = cause;
    if (result !== undefined) data.result = result;
    if (observations !== undefined) data.observations = observations;
    
    if (technicienId !== undefined) {
      if (technicienId) {
        const technicien = await prisma.user.findUnique({
          where: { id: technicienId }
        });

        if (!technicien) {
          return res.status(400).json({ success: false, error: "Le technicien assigné n'existe pas." });
        }
        
        if (!TECHNICIEN_ROLES.includes(technicien.role)) {
          return res.status(400).json({ success: false, error: "L'utilisateur assigné n'a pas le rôle de technicien." });
        }

        if (technicien.statut === 'INACTIF') {
          return res.status(400).json({ success: false, error: "Le technicien assigné est inactif." });
        }
        
        data.technicienId = technicienId;
      } else {
        data.technicienId = null;
      }
    }
    
    if (plannedStart !== undefined) data.plannedStart = plannedStart ? new Date(plannedStart) : null;
    if (plannedEnd !== undefined) data.plannedEnd = plannedEnd ? new Date(plannedEnd) : null;

    if (downtime !== undefined && downtime !== null && downtime !== '') {
      data.downtime = parseFloat(downtime);
    }

    const intervention = await prisma.intervention.update({
      where: { id: req.params.id },
      data
    });

    res.json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

// @desc    Start Intervention
// @route   PATCH /maintenance/interventions/:id/start
// @access  Private
const startIntervention = async (req, res, next) => {
  try {
    const interventionId = req.params.id;
    const existing = await prisma.intervention.findUnique({ where: { id: interventionId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Intervention not found' });

    if (existing.status === 'EN_COURS' || existing.status === 'En cours') {
      return res.status(400).json({ success: false, error: 'Intervention est déjà en cours' });
    }

    const intervention = await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        status: 'EN_COURS',
        actualStart: new Date(),
        startDate: new Date(), // legacy
      }
    });

    res.json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete Intervention
// @route   PATCH /maintenance/interventions/:id/complete
// @access  Private
const completeIntervention = async (req, res, next) => {
  try {
    const interventionId = req.params.id;
    const { cause, result, observations, action, downtime } = req.body;
    const existing = await prisma.intervention.findUnique({ where: { id: interventionId } });
    
    if (!existing) return res.status(404).json({ success: false, error: 'Intervention not found' });

    const now = new Date();
    const actStart = existing.actualStart || existing.startDate || now;
    
    let duration = null;
    if (actStart) {
      duration = parseFloat(((now - new Date(actStart)) / (1000 * 60 * 60)).toFixed(2));
    }

    const data = {
      status: 'TERMINÉE',
      actualEnd: now,
      endDate: now, // legacy
      interventionDuration: duration,
    };

    if (cause !== undefined) data.cause = cause;
    if (result !== undefined) data.result = result;
    if (observations !== undefined) data.observations = observations;
    if (action !== undefined) data.action = action;
    
    // Downtime manually provided or auto-calculated
    if (downtime !== undefined && downtime !== null && downtime !== '') {
      data.downtime = parseFloat(downtime);
    } else if (existing.downtime == null && actStart) {
      data.downtime = duration;
    }

    const intervention = await prisma.intervention.update({
      where: { id: interventionId },
      data
    });

    res.json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Intervention
// @route   PATCH /maintenance/interventions/:id/cancel
// @access  Private
const cancelIntervention = async (req, res, next) => {
  try {
    const interventionId = req.params.id;
    const { reason } = req.body;

    const intervention = await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        status: 'ANNULÉE',
        observations: reason ? `Annulée: ${reason}` : 'Annulée sans motif'
      }
    });

    res.json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Parts to Intervention
// @route   POST /maintenance/interventions/:id/parts
// @access  Private
const addInterventionPart = async (req, res, next) => {
  try {
    const interventionId = req.params.id;
    const { articleId, quantite } = req.body;
    
    if (!articleId || !quantite || quantite <= 0) {
      return res.status(400).json({ success: false, error: "Article et quantité valide requis" });
    }

    const intervention = await prisma.intervention.findUnique({ where: { id: interventionId } });
    if (!intervention) return res.status(404).json({ success: false, error: "Intervention introuvable" });

    // Use Prisma transaction to deduct stock and add intervention part
    await prisma.$transaction(async (tx) => {
      // 1. Issue stock (MultiLocation)
      await stockService.issueStockMultiLocation(tx, {
        articleId,
        quantity: parseFloat(quantite),
        matricule: req.user?.matricule || null
      });

      // 2. Add InterventionPart record
      await tx.interventionPart.create({
        data: {
          interventionId,
          articleId,
          quantite: parseFloat(quantite)
        }
      });
    });

    res.json({ success: true, message: "Pièces ajoutées et stock déduit avec succès" });
  } catch (error) {
    if (error.name === 'InsufficientStockError' || error.name === 'InvalidStockOperationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Change intervention status (Legacy)
// @route   PATCH /maintenance/interventions/:id/status
// @access  Private
const changeInterventionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const interventionId = req.params.id;

    const existing = await prisma.intervention.findUnique({ where: { id: interventionId } });
    const dataToUpdate = { status };

    if ((status === 'Clôturée' || status === 'TERMINÉE') && existing?.downtime == null) {
      const calcDowntime = calculateDowntime(existing?.startDate || existing?.actualStart, existing?.endDate || new Date());
      if (calcDowntime !== null) dataToUpdate.downtime = calcDowntime;
      if (status === 'TERMINÉE') {
        dataToUpdate.actualEnd = new Date();
      }
    }

    const intervention = await prisma.intervention.update({
      where: { id: interventionId },
      data: dataToUpdate
    });

    res.json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete intervention
// @route   DELETE /maintenance/interventions/:id
// @access  Private
const deleteIntervention = async (req, res, next) => {
  try {
    await prisma.intervention.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: "Intervention deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get techniciens
// @route   GET /maintenance/techniciens
// @access  Private
const getTechniciens = async (req, res, next) => {
  try {
    const techniciens = await prisma.user.findMany({
      where: { role: { in: TECHNICIEN_ROLES } },
      include: {
        skills: true,
        interventions: { include: { machine: true } },
        formations: true,
        preventiveMaintenances: { include: { machine: true } }
      }
    });

    const formatted = techniciens.map(t => {
      const skillsObj = {};
      t.skills.forEach(s => {
        skillsObj[s.name] = {
          level: s.level,
          certExpiration: s.certExpiration,
          lastTraining: s.lastTraining,
          lastEval: s.lastEval,
          trainer: s.trainer
        };
      });

      const totalInterventions = t.interventions.length;
      const completedInterventions = t.interventions.filter(i => i.status === 'Clôturée' || i.status === 'TERMINÉE').length;
      const delayedInterventions = t.interventions.filter(i => i.status === 'En retard' || i.status === 'EN_RETARD').length;
      const activeInterventions = t.interventions.filter(i => i.status === 'En cours' || i.status === 'EN_COURS' || i.status === 'En attente' || i.status === 'PLANIFIÉE').length;
      
      const completedWithTime = t.interventions.filter(i => (i.status === 'Clôturée' || i.status === 'TERMINÉE') && i.downtime != null);
      let mttr = 0;
      if (completedWithTime.length > 0) {
        mttr = parseFloat((completedWithTime.reduce((sum, curr) => sum + curr.downtime, 0) / completedWithTime.length).toFixed(2));
      }

      // Extract unique machines
      const machineMap = new Map();
      t.interventions.forEach(i => {
         if (i.machine) machineMap.set(i.machine.id, { id: i.machine.id, nom: i.machine.nom, code: i.machine.code });
      });
      t.preventiveMaintenances.forEach(pm => {
         if (pm.machine) machineMap.set(pm.machine.id, { id: pm.machine.id, nom: pm.machine.nom, code: pm.machine.code });
      });
      const machines = Array.from(machineMap.values());

      return {
        id: t.id,
        empNumber: t.matricule,
        name: t.nom,
        photoUrl: t.photoUrl,
        department: t.department || 'Non assigné',
        position: t.position || 'Technicien',
        manager: 'Non assigné',
        status: t.statut,
        skills: skillsObj,
        performance: {
          totalInterventions,
          completedInterventions,
          activeInterventions,
          delayedInterventions,
          workload: activeInterventions,
          mttr
        },
        machines: machines,
        preventiveMaintenances: t.preventiveMaintenances.map(pm => ({
            id: pm.id,
            code: pm.code,
            type: pm.type,
            status: pm.status,
            frequency: pm.frequency,
            nextMaintenanceDate: pm.nextMaintenanceDate,
            machine: pm.machine ? { nom: pm.machine.nom, code: pm.machine.code } : null
        })),
        recentInterventions: t.interventions.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(i => ({
            id: i.id,
            code: i.code,
            type: i.type,
            status: i.status,
            machine: i.machine ? { nom: i.machine.nom, code: i.machine.code } : null,
            createdAt: i.createdAt
        })),
        formations: t.formations.map(f => ({
          id: f.id,
          formationName: f.formationName,
          certStatus: f.certStatus,
          progress: f.progress
        }))
      };
    });

    res.json({ success: true, data: { techniciens: formatted } });
  } catch (error) {
    next(error);
  }
};

// Helper for Skill Level Mapping
const mapSkillLevel = (levelStr) => {
  switch (levelStr) {
    case 'Expert': return 3;
    case 'Confirmed': return 2;
    case 'Beginner': return 1;
    default: return 0;
  }
};

// @desc    Get formations
// @route   GET /maintenance/formations
// @access  Private
const getFormations = async (req, res, next) => {
  try {
    const formations = await prisma.formation.findMany({
      include: { technicien: true }
    });

    const formatted = formations.map(f => ({
      id: f.id,
      formation: f.formationName,
      trainer: f.trainer,
      startDate: f.startDate,
      endDate: f.endDate,
      progress: f.progress,
      certStatus: f.certStatus,
      skillLevel: f.skillLevel,
      technician: {
        id: f.technicien?.id,
        name: f.technicien?.nom || 'Inconnu',
        department: f.technicien?.department || '-'
      }
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Get formation catalog
// @route   GET /maintenance/formation-catalog
// @access  Private
const getFormationCatalog = async (req, res, next) => {
  try {
    const catalog = await prisma.formationCatalog.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: catalog });
  } catch (error) {
    next(error);
  }
};

// @desc    Create formation catalog entry
// @route   POST /maintenance/formation-catalog
// @access  Private
const createFormationCatalog = async (req, res, next) => {
  try {
    let { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    name = name.trim();
    
    // Check for duplicates
    const existing = await prisma.formationCatalog.findFirst({
      where: { name: { equals: name } }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Formation already exists' });
    }
    
    const entry = await prisma.formationCatalog.create({
      data: { name }
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Create formation
// @route   POST /maintenance/formations
// @access  Private
const createFormation = async (req, res, next) => {
  try {
    const { technicienId, formationName, trainer, startDate, endDate, certStatus, skillLevel, progress, certificationDate, expirationDate } = req.body;
    
    const technicien = await prisma.user.findUnique({
      where: { id: technicienId }
    });

    if (!technicien || !TECHNICIEN_ROLES.includes(technicien.role)) {
      return res.status(400).json({ success: false, error: "Technicien invalide ou introuvable" });
    }

    const formation = await prisma.$transaction(async (tx) => {
      const newFormation = await tx.formation.create({
        data: {
          technicienId: technicienId,
          formationName,
          trainer,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          certStatus,
          skillLevel,
          progress: parseInt(progress || 0),
          certificationDate: certificationDate ? new Date(certificationDate) : null,
          expirationDate: expirationDate ? new Date(expirationDate) : null
        }
      });

      if (certStatus === 'Certified') {
        const existingSkill = await tx.skill.findFirst({
          where: { technicienId: technicienId, name: formationName }
        });

        if (existingSkill) {
          await tx.skill.update({
            where: { id: existingSkill.id },
            data: {
              level: mapSkillLevel(skillLevel),
              lastTraining: newFormation.certificationDate || newFormation.endDate,
              certExpiration: newFormation.expirationDate,
              trainer: trainer
            }
          });
        } else {
          await tx.skill.create({
            data: {
              technicienId: technicienId,
              name: formationName,
              level: mapSkillLevel(skillLevel),
              lastTraining: newFormation.certificationDate || newFormation.endDate,
              certExpiration: newFormation.expirationDate,
              trainer: trainer
            }
          });
        }
      }

      await tx.formationHistory.create({
        data: {
          formation_id: newFormation.id,
          user_id: req.user?.id || null,
          action: 'CREATE',
          new_state: `Status: ${certStatus}, Progress: ${progress}%`
        }
      });

      return newFormation;
    });

    res.status(201).json({ success: true, data: formation });
  } catch (error) {
    next(error);
  }
};

// @desc    Update formation
// @route   PUT /maintenance/formations/:id
// @access  Private
const updateFormation = async (req, res, next) => {
  try {
    const { formationName, trainer, startDate, endDate, certStatus, skillLevel, progress, certificationDate, expirationDate } = req.body;
    
    const formation = await prisma.$transaction(async (tx) => {
      const existingFormation = await tx.formation.findUnique({
        where: { id: req.params.id }
      });

      if (!existingFormation) throw new Error("Formation not found");

      const updatedFormation = await tx.formation.update({
        where: { id: req.params.id },
        data: {
          formationName,
          trainer,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          certStatus,
          skillLevel,
          progress: progress !== undefined ? parseInt(progress) : undefined,
          certificationDate: certificationDate ? new Date(certificationDate) : undefined,
          expirationDate: expirationDate ? new Date(expirationDate) : undefined
        }
      });

      if (updatedFormation.certStatus === 'Certified') {
        const existingSkill = await tx.skill.findFirst({
          where: { technicienId: updatedFormation.technicienId, name: updatedFormation.formationName }
        });

        if (existingSkill) {
          await tx.skill.update({
            where: { id: existingSkill.id },
            data: {
              level: mapSkillLevel(updatedFormation.skillLevel),
              lastTraining: updatedFormation.certificationDate || updatedFormation.endDate,
              certExpiration: updatedFormation.expirationDate,
              trainer: updatedFormation.trainer
            }
          });
        } else {
          await tx.skill.create({
            data: {
              technicienId: updatedFormation.technicienId,
              name: updatedFormation.formationName,
              level: mapSkillLevel(updatedFormation.skillLevel),
              lastTraining: updatedFormation.certificationDate || updatedFormation.endDate,
              certExpiration: updatedFormation.expirationDate,
              trainer: updatedFormation.trainer
            }
          });
        }
      }

      await tx.formationHistory.create({
        data: {
          formation_id: updatedFormation.id,
          user_id: req.user?.id || null,
          action: 'UPDATE',
          previous_state: `Status: ${existingFormation.certStatus}, Progress: ${existingFormation.progress}%`,
          new_state: `Status: ${updatedFormation.certStatus}, Progress: ${updatedFormation.progress}%`
        }
      });

      return updatedFormation;
    });

    res.json({ success: true, data: formation });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete formation
// @route   DELETE /maintenance/formations/:id
// @access  Private
const deleteFormation = async (req, res, next) => {
  try {
    await prisma.formation.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: "Formation deleted" });
  } catch (error) {
    next(error);
  }
};

// Additional helper API
const getMachines = async (req, res, next) => {
  try {
    const machines = await prisma.machine.findMany();
    res.json({ success: true, data: machines });
  } catch (error) {
    next(error);
  }
};

// @desc    Get formation by ID
// @route   GET /maintenance/formations/:id
// @access  Private
const getFormationById = async (req, res, next) => {
  try {
    const formation = await prisma.formation.findUnique({
      where: { id: req.params.id },
      include: { technicien: true }
    });

    if (!formation) {
      return res.status(404).json({ success: false, error: 'Formation not found' });
    }

    res.json({ success: true, data: formation });
  } catch (error) {
    next(error);
  }
};

// @desc    Get formation history
// @route   GET /maintenance/formations/:id/history
// @access  Private
const getFormationHistory = async (req, res, next) => {
  try {
    const history = await prisma.formationHistory.findMany({
      where: { formation_id: req.params.id },
      orderBy: { timestamp: 'desc' },
      include: { user: true }
    });

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKpis,
  getInterventions,
  getInterventionById,
  createIntervention,
  updateIntervention,
  startIntervention,
  completeIntervention,
  cancelIntervention,
  addInterventionPart,
  deleteIntervention,
  changeInterventionStatus,
  getTechniciens,
  getFormations,
  createFormation,
  updateFormation,
  deleteFormation,
  getFormationById,
  getFormationHistory,
  getFormationCatalog,
  createFormationCatalog,
  getMachines,
};
