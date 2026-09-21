async function logUserCreate(actorId, userId, userData, prisma) {
  await prisma.userAuditLog.create({
    data: {
      actorId,
      userId,
      action: 'CREATE',
      changes: JSON.stringify({
        nom: userData.nom,
        matricule: userData.matricule,
        role: userData.role,
        statut: userData.statut,
        managerId: userData.managerId
      })
    }
  });
}

async function logUserUpdate(actorId, userId, oldData, newData, prisma) {
  const changes = {};
  let hasChanges = false;
  
  const fieldsToCheck = ['nom', 'email', 'matricule', 'role', 'statut', 'managerId', 'photoUrl'];
  
  fieldsToCheck.forEach(field => {
    if (newData[field] !== undefined && newData[field] !== oldData[field]) {
      changes[field] = {
        old: oldData[field],
        new: newData[field]
      };
      hasChanges = true;
    }
  });
  
  if (newData.mot_de_passe) {
    changes.mot_de_passe = { old: '***', new: '***' };
    hasChanges = true;
  }

  if (hasChanges) {
    await prisma.userAuditLog.create({
      data: {
        actorId,
        userId,
        action: 'UPDATE',
        changes: JSON.stringify(changes)
      }
    });
  }
}

async function logUserDelete(actorId, userId, userData, prisma) {
  await prisma.userAuditLog.create({
    data: {
      actorId,
      userId: userId, // Preserve the link for soft deletes
      action: 'DELETE',
      changes: JSON.stringify({
        deletedUser: {
          id: userData.id,
          nom: userData.nom,
          matricule: userData.matricule,
          role: userData.role
        }
      })
    }
  });
}

module.exports = {
  logUserCreate,
  logUserUpdate,
  logUserDelete
};
