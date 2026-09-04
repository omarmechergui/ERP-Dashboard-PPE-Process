const prisma = require('../config/db');
const { TECHNICIEN_ROLES } = require('../helpers/stockHelpers');

// --- Helper Functions ---

const isLastDayOfMonth = (date) => {
    const testDate = new Date(date.getTime());
    testDate.setDate(testDate.getDate() + 1);
    return testDate.getDate() === 1;
};

const getEndOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const calculateNextDate = (lastDate, frequency) => {
  if (!lastDate) return new Date();
  const date = new Date(lastDate);
  
  switch (frequency) {
    case 'DAILY': 
        date.setDate(date.getDate() + 1);
        return date;
    case 'WEEKLY': 
        date.setDate(date.getDate() + 7);
        return date;
    case 'MONTHLY': {
        const wasLastDay = isLastDayOfMonth(date);
        date.setMonth(date.getMonth() + 1);
        if (wasLastDay) return getEndOfMonth(date);
        return date;
    }
    case 'QUARTERLY': {
        const wasLastDay = isLastDayOfMonth(date);
        date.setMonth(date.getMonth() + 3);
        if (wasLastDay) return getEndOfMonth(date);
        return date;
    }
    case 'SEMI_ANNUALLY': {
        const wasLastDay = isLastDayOfMonth(date);
        date.setMonth(date.getMonth() + 6);
        if (wasLastDay) return getEndOfMonth(date);
        return date;
    }
    case 'ANNUALLY': {
        const wasLastDay = isLastDayOfMonth(date);
        date.setFullYear(date.getFullYear() + 1);
        if (wasLastDay) return getEndOfMonth(date);
        return date;
    }
    default: 
        date.setMonth(date.getMonth() + 1);
        return date;
  }
};

const validateTechnicien = async (technicienId) => {
    if (!technicienId) return null;
    const technicien = await prisma.user.findUnique({
        where: { id: technicienId }
    });
    if (!technicien) throw new Error("Le technicien assigné n'existe pas.");
    if (!TECHNICIEN_ROLES.includes(technicien.role)) throw new Error("L'utilisateur assigné n'a pas le rôle de technicien.");
    if (technicien.statut === 'INACTIF') throw new Error("Le technicien assigné est inactif.");
    return technicienId;
};

// --- Controller Methods ---

const getPreventiveMaintenances = async (req, res, next) => {
  try {
    const { status, frequency, machineId, technicienId } = req.query;
    const where = {};
    if (status && status !== 'Tous') where.status = status;
    if (frequency && frequency !== 'Tous') where.frequency = frequency;
    if (machineId && machineId !== 'Tous') where.machineId = machineId;
    if (technicienId && technicienId !== 'Tous') where.technicienId = technicienId;

    // Auto-mark overdue
    await prisma.preventiveMaintenance.updateMany({
        where: {
            status: { in: ['PLANNED', 'TO_DO'] },
            nextMaintenanceDate: { lt: new Date() }
        },
        data: { status: 'OVERDUE' }
    });

    const records = await prisma.preventiveMaintenance.findMany({
      where,
      include: {
        machine: true,
        technicien: true,
        checklistItems: true
      },
      orderBy: { nextMaintenanceDate: 'asc' }
    });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getPreventiveMaintenanceById = async (req, res, next) => {
  try {
    const record = await prisma.preventiveMaintenance.findUnique({
      where: { id: req.params.id },
      include: {
        machine: true,
        technicien: true,
        checklistItems: true
      }
    });

    if (!record) return res.status(404).json({ success: false, error: 'Maintenance non trouvée' });
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const createPreventiveMaintenance = async (req, res, next) => {
  try {
    const { machineId, technicienId, frequency, lastMaintenanceDate, nextMaintenanceDate, description, checklistItems } = req.body;
    
    if (!machineId || !frequency || !technicienId) {
        return res.status(400).json({ success: false, error: 'Machine, Fréquence et Technicien requis.' });
    }

    const validTechnicienId = await validateTechnicien(technicienId).catch(err => { throw { status: 400, message: err.message }});

    const { nextSeq } = require('../helpers/counterHelper');
    const nextNum = await nextSeq(prisma, 'preventiveMaintenance');
    const code = `PM-${String(nextNum).padStart(5, '0')}`;

    const calculatedNextDate = nextMaintenanceDate 
        ? new Date(nextMaintenanceDate) 
        : calculateNextDate(lastMaintenanceDate ? new Date(lastMaintenanceDate) : new Date(), frequency);

    const record = await prisma.preventiveMaintenance.create({
      data: {
        code,
        machineId: machineId,
        technicienId: validTechnicienId,
        frequency,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        nextMaintenanceDate: calculatedNextDate,
        description: description || null,
        checklistItems: {
            create: checklistItems?.map(item => ({ description: item.description })) || []
        }
      },
      include: { checklistItems: true }
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, error: error.message });
      next(error);
  }
};

const updatePreventiveMaintenance = async (req, res, next) => {
  try {
    const { machineId, technicienId, frequency, nextMaintenanceDate, description, status, observations, duration } = req.body;
    const id = req.params.id;

    const data = {};
    if (machineId !== undefined) data.machineId = machineId;
    if (technicienId !== undefined) {
         if (!technicienId) throw { status: 400, message: "Technicien requis." };
         data.technicienId = await validateTechnicien(technicienId).catch(err => { throw { status: 400, message: err.message }});
    }
    if (frequency !== undefined) data.frequency = frequency;
    if (nextMaintenanceDate !== undefined) data.nextMaintenanceDate = new Date(nextMaintenanceDate);
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (observations !== undefined) data.observations = observations;
    if (duration !== undefined) data.duration = duration ? parseFloat(duration) : null;

    const record = await prisma.preventiveMaintenance.update({
      where: { id },
      data,
      include: { machine: true, technicien: true, checklistItems: true }
    });

    res.json({ success: true, data: record });
  } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, error: error.message });
      next(error);
  }
};

const deletePreventiveMaintenance = async (req, res, next) => {
  try {
    await prisma.preventiveMaintenance.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: "Maintenance préventive supprimée" });
  } catch (error) {
    next(error);
  }
};

const updateChecklist = async (req, res, next) => {
    try {
        const { items } = req.body; // Array of { id, status, comment, inspectionDate }
        const id = req.params.id;

        for (const item of items) {
            if (item.id) {
                await prisma.preventiveChecklistItem.update({
                    where: { id: item.id },
                    data: {
                        status: item.status,
                        comment: item.comment,
                        inspectionDate: item.inspectionDate ? new Date(item.inspectionDate) : new Date()
                    }
                });
            }
        }
        const record = await prisma.preventiveMaintenance.findUnique({
            where: { id },
            include: { checklistItems: true }
        });
        res.json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
}

const changeStatus = async (req, res, next) => {
  try {
    const { status, observations, duration } = req.body;
    const id = req.params.id;

    const existing = await prisma.preventiveMaintenance.findUnique({ 
        where: { id },
        include: { checklistItems: true }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Non trouvé' });

    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        // Cycle continuation (Option A)
        const newLastDate = new Date(); // Or existing.nextMaintenanceDate depending on strictness
        const newNextDate = calculateNextDate(newLastDate, existing.frequency);
        
        await prisma.preventiveMaintenance.update({
            where: { id },
            data: { 
                status: 'COMPLETED',
                observations: observations || existing.observations,
                duration: duration ? parseFloat(duration) : existing.duration,
                lastMaintenanceDate: newLastDate // mark completed date
            }
        });

        // Create the NEXT cycle record immediately
         const { nextSeq } = require('../helpers/counterHelper');
         const nextNum = await nextSeq(prisma, 'preventiveMaintenance');
         const newCode = `PM-${String(nextNum).padStart(5, '0')}`;

         await prisma.preventiveMaintenance.create({
            data: {
                code: newCode,
                machineId: existing.machineId,
                technicienId: existing.technicienId,
                type: existing.type,
                frequency: existing.frequency,
                lastMaintenanceDate: newLastDate,
                nextMaintenanceDate: newNextDate,
                status: 'PLANNED',
                description: existing.description,
                checklistItems: {
                    create: existing.checklistItems.map(item => ({ description: item.description }))
                }
            }
         });
    } else {
        await prisma.preventiveMaintenance.update({
            where: { id },
            data: { status }
        });
    }

    const updated = await prisma.preventiveMaintenance.findUnique({ where: { id }});
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const getKpis = async (req, res, next) => {
    try {
        const total = await prisma.preventiveMaintenance.count();
        const toDo = await prisma.preventiveMaintenance.count({ where: { status: 'TO_DO' } });
        const overdue = await prisma.preventiveMaintenance.count({ where: { status: 'OVERDUE' } });
        const completed = await prisma.preventiveMaintenance.count({ where: { status: 'COMPLETED' } });
        
        const next7Days = new Date();
        next7Days.setDate(next7Days.getDate() + 7);
        const upcoming = await prisma.preventiveMaintenance.count({
            where: {
                status: { in: ['PLANNED', 'TO_DO'] },
                nextMaintenanceDate: { lte: next7Days, gt: new Date() }
            }
        });

        res.json({
            success: true,
            data: {
                total,
                toDo,
                overdue,
                completed,
                upcoming
            }
        });
    } catch (error) {
        next(error);
    }
}

const getHistory = async (req, res, next) => {
    try {
        const history = await prisma.preventiveMaintenance.findMany({
            where: { status: 'COMPLETED' },
            include: { machine: true, technicien: true, checklistItems: true },
            orderBy: { lastMaintenanceDate: 'desc' }
        });
        res.json({ success: true, data: history });
    } catch(error) {
        next(error);
    }
}

// --- Excel Import ---

const ALLOWED_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'];

const validateImportRows = async (rows) => {
    const machines = await prisma.machine.findMany();
    const techniciens = await prisma.user.findMany({ where: { role: { in: TECHNICIEN_ROLES } } });
    const existingPMs = await prisma.preventiveMaintenance.findMany({ where: { status: { not: 'COMPLETED' } }});

    const machineMap = new Map(machines.map(m => [m.code, m.id]));
    const techMap = new Map(techniciens.map(t => [t.matricule, t.id]));

    let validCount = 0;
    let failedCount = 0;
    let previewRows = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let error = null;

        const mCode = row['Machine Code'] ? String(row['Machine Code']).trim() : null;
        const freq = row['Frequency'] ? String(row['Frequency']).trim() : null;
        const lastD = row['Last Maintenance'];
        const nextD = row['Next Maintenance'];
        const techMat = row['Technician'] ? String(row['Technician']).trim() : null;

        if (!mCode) error = "Machine Code requis.";
        
        if (!error && !freq) error = "Frequency requise.";
        else if (!error && !ALLOWED_FREQUENCIES.includes(freq)) error = `Frequency invalide: ${freq}`;

        if (!error && nextD) {
            const d = new Date(nextD);
            if (isNaN(d.getTime())) error = `Next Maintenance invalide: ${nextD}`;
        }

        if (!error && !techMat) error = "Technicien requis.";
        else if (!error && techMat) {
            if (!techMap.has(techMat)) error = `Technicien non trouvé: ${techMat}`;
        }

        // Duplicate check (Logical: same machine, same freq, not completed)
        if (!error) {
             const mId = machineMap.get(mCode);
             if (mId) {
                 const isDup = existingPMs.some(pm => 
                     pm.machineId === mId && 
                     pm.frequency === freq
                 );
                 if (isDup) error = "Un plan de maintenance similaire existe déjà pour cette machine.";
             }
        }

        if (error) {
            failedCount++;
            previewRows.push({ ...row, Status: 'Error', Error: error, canImport: false });
        } else {
            validCount++;
            previewRows.push({ 
                ...row, 
                Status: 'Valid', 
                machineId: machineMap.get(mCode) || null,
                mCodeToCreate: machineMap.has(mCode) ? null : mCode,
                technicienId: techMat ? techMap.get(techMat) : null,
                canImport: true 
            });
        }
    }

    return { previewRows, validCount, failedCount };
}

const validateImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        if (!rows || !Array.isArray(rows)) return res.status(400).json({ success: false, error: 'Données invalides' });

        const validation = await validateImportRows(rows);
        
        res.json({
            success: true,
            successCount: validation.validCount,
            failedCount: validation.failedCount,
            previewRows: validation.previewRows,
            canImport: validation.validCount > 0
        });

    } catch (error) {
        next(error);
    }
}

const confirmImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        if (!rows || !Array.isArray(rows)) return res.status(400).json({ success: false, error: 'Données invalides' });

        // Re-validate
        const validation = await validateImportRows(rows);
        const validRows = validation.previewRows.filter(r => r.canImport);

        if (validRows.length === 0) {
            return res.status(400).json({ success: false, error: 'Aucune ligne valide à importer.' });
        }

        let createdCount = 0;

        await prisma.$transaction(async (tx) => {
            const { nextSeq } = require('../helpers/counterHelper');
            
            const newMachinesCache = new Map();

            for (const row of validRows) {
                let mId = row.machineId;

                if (!mId && row.mCodeToCreate) {
                    if (newMachinesCache.has(row.mCodeToCreate)) {
                        mId = newMachinesCache.get(row.mCodeToCreate);
                    } else {
                        const newMachine = await tx.machine.create({
                            data: {
                                code: row.mCodeToCreate,
                                nom: row.mCodeToCreate
                            }
                        });
                        mId = newMachine.id;
                        newMachinesCache.set(row.mCodeToCreate, mId);
                    }
                }

                const nextNum = await nextSeq(tx, 'preventiveMaintenance');
                const code = `PM-${String(nextNum).padStart(5, '0')}`;

                let nextDate = row['Next Maintenance'] ? new Date(row['Next Maintenance']) : null;
                const lastDate = row['Last Maintenance'] ? new Date(row['Last Maintenance']) : null;

                if (!nextDate) {
                    nextDate = calculateNextDate(lastDate || new Date(), row['Frequency']);
                }

                await tx.preventiveMaintenance.create({
                    data: {
                        code,
                        machineId: mId,
                        technicienId: row.technicienId,
                        frequency: row['Frequency'],
                        lastMaintenanceDate: lastDate,
                        nextMaintenanceDate: nextDate,
                        description: row['Description'] || null,
                        type: 'PREVENTIVE',
                        status: 'PLANNED'
                    }
                });
                createdCount++;
            }
        });

        res.json({
            success: true,
            successCount: createdCount,
            failedCount: validation.failedCount,
            failedRows: validation.previewRows.filter(r => !r.canImport)
        });

    } catch (error) {
        next(error);
    }
}


module.exports = {
  getPreventiveMaintenances,
  getPreventiveMaintenanceById,
  createPreventiveMaintenance,
  updatePreventiveMaintenance,
  deletePreventiveMaintenance,
  changeStatus,
  updateChecklist,
  getKpis,
  getHistory,
  validateImport,
  confirmImport
};
