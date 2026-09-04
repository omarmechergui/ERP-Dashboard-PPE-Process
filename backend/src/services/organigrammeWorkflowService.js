const { AppError } = require('../helpers/AppError');

const VALID_TRANSITIONS = {
  BROUILLON: ['EN_VALIDATION'],
  EN_VALIDATION: ['VALIDE', 'REJETE'],
  REJETE: ['EN_VALIDATION'], // changed from BROUILLON to EN_VALIDATION as per requirements
  VALIDE: ['ARCHIVE'],
  ARCHIVE: []
};

const ALLOWED_ROLES = {
  submit: ['ADMIN', 'MANAGER', 'GL', 'SUPERVISEUR'],
  validate: ['ADMIN', 'MANAGER', 'GL'],
  reject: ['ADMIN', 'MANAGER', 'GL'],
  archive: ['ADMIN', 'MANAGER']
};

/**
 * Handles workflow transition
 */
async function transitionOrganigramme(organigrammeId, action, currentUser, prisma, payload = {}) {
  return await prisma.$transaction(async (tx) => {
    const org = await tx.organigramme.findUnique({
      where: { id: organigrammeId }
    });

    if (!org) throw new AppError("Organigramme non trouvé", 404, "NOT_FOUND");

    // Concurrency control via updatedAt (if provided)
    if (payload.updatedAt && new Date(payload.updatedAt).getTime() !== org.updatedAt.getTime()) {
      throw new AppError("L'organigramme a été modifié par un autre utilisateur. Veuillez rafraîchir.", 409, "CONCURRENCY_ERROR");
    }

    let nextStatus = '';
    const currentStatus = org.statut;

    // Determine next status and validate role
    switch (action) {
      case 'submit':
      case 'resubmit':
        if (!ALLOWED_ROLES.submit.includes(currentUser.role)) {
          throw new AppError("Non autorisé à soumettre", 403, "FORBIDDEN");
        }
        nextStatus = 'EN_VALIDATION';
        break;
      case 'validate':
        if (!ALLOWED_ROLES.validate.includes(currentUser.role)) {
          throw new AppError("Non autorisé à valider", 403, "FORBIDDEN");
        }
        nextStatus = 'VALIDE';
        break;
      case 'reject':
        if (!ALLOWED_ROLES.reject.includes(currentUser.role)) {
          throw new AppError("Non autorisé à rejeter", 403, "FORBIDDEN");
        }
        if (!payload.rejectionReason || payload.rejectionReason.trim().length === 0) {
          throw new AppError("La raison du rejet est requise", 400, "REJECTION_REASON_REQUIRED");
        }
        nextStatus = 'REJETE';
        break;
      case 'archive':
        if (!ALLOWED_ROLES.archive.includes(currentUser.role)) {
          throw new AppError("Non autorisé à archiver", 403, "FORBIDDEN");
        }
        nextStatus = 'ARCHIVE';
        break;
      default:
        throw new AppError(`Action inconnue: ${action}`, 400, "INVALID_ACTION");
    }

    // Validate transition
    if (!VALID_TRANSITIONS[currentStatus] || !VALID_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new AppError(`Transition invalide de ${currentStatus} vers ${nextStatus}`, 400, "INVALID_TRANSITION");
    }

    // Prepare update data
    const updateData = { statut: nextStatus };
    const historyData = {
      organigramme_id: org.id,
      previous_status: currentStatus,
      new_status: nextStatus,
      user_id: currentUser.id,
      comment: payload.comment || null,
      rejection_reason: payload.rejectionReason || null
    };

    if (nextStatus === 'EN_VALIDATION') {
      updateData.submittedBy = currentUser.id;
      updateData.submittedAt = new Date();
    } else if (nextStatus === 'VALIDE') {
      updateData.validatedBy = currentUser.id;
      updateData.validatedAt = new Date();

      // Auto-archive previously active organigrammes
      const previousActives = await tx.organigramme.findMany({
        where: { statut: 'VALIDE', id: { not: org.id } }
      });
      
      if (previousActives.length > 0) {
        await tx.organigramme.updateMany({
          where: { statut: 'VALIDE', id: { not: org.id } },
          data: { statut: 'ARCHIVE', archivedAt: new Date() }
        });
        
        for (const p of previousActives) {
           await tx.organigrammeHistory.create({
             data: {
               organigramme_id: p.id,
               previous_status: 'VALIDE',
               new_status: 'ARCHIVE',
               user_id: currentUser.id,
               comment: `Archivé automatiquement suite à la validation de la V${org.version}`
             }
           });
        }
      }
    } else if (nextStatus === 'REJETE') {
      updateData.rejectedBy = currentUser.id;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = payload.rejectionReason;
    } else if (nextStatus === 'ARCHIVE') {
      updateData.archivedAt = new Date();
    }

    // Execute update and history insert
    const updatedOrg = await tx.organigramme.update({
      where: { id: org.id },
      data: updateData
    });

    await tx.organigrammeHistory.create({ data: historyData });

    return updatedOrg;
  });
}

/**
 * Creates a new BROUILLON version by cloning a VALIDE organigramme
 */
async function cloneOrganigramme(organigrammeId, currentUser, prisma) {
  return await prisma.$transaction(async (tx) => {
    const org = await tx.organigramme.findUnique({
      where: { id: organigrammeId }
    });

    if (!org) throw new AppError("Organigramme non trouvé", 404, "NOT_FOUND");
    
    if (org.statut !== 'VALIDE') {
      throw new AppError("Seul un organigramme VALIDE peut être cloné pour modification", 400, "INVALID_CLONE_SOURCE");
    }

    // Determine new version number (max version + 1)
    const maxVersion = await tx.organigramme.aggregate({
      _max: { version: true }
    });
    
    const newVersion = (maxVersion._max.version || 1) + 1;

    // Create the clone
    const clonedOrg = await tx.organigramme.create({
      data: {
        titre: `${org.titre} (V${newVersion})`,
        description: org.description,
        snapshot: org.snapshot,
        statut: 'BROUILLON',
        version: newVersion,
        createdBy: currentUser.id
      }
    });

    // Add history for the clone creation
    await tx.organigrammeHistory.create({
      data: {
        organigramme_id: clonedOrg.id,
        previous_status: null,
        new_status: 'BROUILLON',
        user_id: currentUser.id,
        comment: `Cloné à partir de la version ${org.version} (ID: ${org.id})`
      }
    });

    return clonedOrg;
  });
}

module.exports = {
  transitionOrganigramme,
  cloneOrganigramme
};
