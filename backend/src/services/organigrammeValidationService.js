const { AppError } = require('../helpers/AppError');
const { VALID_MANAGER_ROLES, checkCircularReference } = require('./userHierarchy');

/**
 * Validates an organigramme tree snapshot
 * @param {Array} tree - The org tree snapshot array
 * @param {Object} prisma - Prisma client instance
 */
async function validateOrgSnapshot(tree, prisma) {
  if (!tree || !Array.isArray(tree)) {
    throw new AppError("Snapshot invalide. Doit être un tableau.", 400, "INVALID_SNAPSHOT");
  }

  // Flatten tree to get all nodes
  const allNodes = [];
  const nodeMap = new Map();
  const duplicateIds = new Set();
  
  const flatten = (nodes) => {
    for (const node of nodes) {
      if (nodeMap.has(node.id)) {
        duplicateIds.add(node.id);
      }
      allNodes.push(node);
      nodeMap.set(node.id, node);
      if (node.children && Array.isArray(node.children)) {
        flatten(node.children);
      }
    }
  };
  
  flatten(tree);

  if (duplicateIds.size > 0) {
    throw new AppError(`Doublons détectés dans l'organigramme: ${Array.from(duplicateIds).join(', ')}`, 400, "DUPLICATE_NODES");
  }

  if (allNodes.length === 0) return true; // Empty org is valid

  // Validate users exist in DB
  const userIds = allNodes.map(n => n.id);
  const dbUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, role: true, statut: true }
  });

  if (dbUsers.length !== userIds.length) {
    const dbUserIds = new Set(dbUsers.map(u => u.id));
    const missing = userIds.filter(id => !dbUserIds.has(id));
    throw new AppError(`Utilisateurs introuvables en base de données: ${missing.join(', ')}`, 400, "MISSING_USERS");
  }

  const dbUserMap = new Map(dbUsers.map(u => [u.id, u]));

  // Check roles and circular refs
  for (const node of allNodes) {
    const dbUser = dbUserMap.get(node.id);
    
    // Check inactive users
    if (dbUser.statut !== 'ACTIF') {
       throw new AppError(`L'utilisateur ${node.id} est inactif et ne peut pas faire partie du nouvel organigramme.`, 400, "INACTIVE_USER");
    }

    if (node.managerId) {
      if (node.managerId === node.id) {
        throw new AppError(`L'utilisateur ${node.id} ne peut pas être son propre manager.`, 400, "SELF_MANAGER");
      }

      const managerNode = nodeMap.get(node.managerId);
      if (!managerNode) {
        throw new AppError(`Manager ${node.managerId} introuvable dans le snapshot.`, 400, "ORPHAN_NODE");
      }

      const managerDbUser = dbUserMap.get(node.managerId);
      
      // Role validation using userHierarchy.js rules
      const allowedManagerRoles = VALID_MANAGER_ROLES[dbUser.role];
      if (allowedManagerRoles && !allowedManagerRoles.includes(managerDbUser.role)) {
        throw new AppError(`Hiérarchie invalide: Un ${dbUser.role} ne peut pas avoir un ${managerDbUser.role} comme manager.`, 400, "INVALID_HIERARCHY_ROLE");
      }
    }
  }

  // Circular reference check (graph cycle detection)
  for (const node of allNodes) {
    let current = node;
    const visited = new Set([current.id]);
    
    while (current.managerId) {
      if (visited.has(current.managerId)) {
        throw new AppError(`Référence circulaire détectée impliquant l'utilisateur ${current.managerId}.`, 400, "CIRCULAR_REFERENCE");
      }
      visited.add(current.managerId);
      current = nodeMap.get(current.managerId);
      if (!current) break; // Orphan node already caught above
    }
  }

  return true;
}

module.exports = {
  validateOrgSnapshot
};
