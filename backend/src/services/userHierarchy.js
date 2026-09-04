const { AppError } = require('../helpers/AppError');

// ============================================================
// SINGLE SOURCE OF TRUTH — Role Hierarchy Configuration
// ============================================================

/**
 * For each user role, which manager roles are allowed.
 * Empty array = no manager allowed (root role).
 */
const VALID_MANAGER_ROLES = {
  ADMIN:          [],
  MANAGER:        ['ADMIN'],
  GL:             ['MANAGER', 'ADMIN'],
  TL:             ['GL', 'MANAGER', 'ADMIN'],
  SUPERVISEUR:    ['TL', 'GL', 'MANAGER', 'ADMIN'],
  DESIGNER:       ['TL', 'GL', 'MANAGER', 'ADMIN'],
  TECHNICIEN:     ['SUPERVISEUR', 'TL', 'GL', 'MANAGER', 'ADMIN'],
  TECHNICIENSTOCK:['SUPERVISEUR', 'TL', 'GL', 'MANAGER', 'ADMIN'],
  OPERATEUR:      ['SUPERVISEUR', 'TL', 'GL', 'MANAGER', 'ADMIN'],
};

/**
 * Numeric level for ordering / display.
 * DESIGNER and SUPERVISEUR are both level 4 (directly under TL).
 */
const ROLE_LEVEL = {
  ADMIN: 0,
  MANAGER: 1,
  GL: 2,
  TL: 3,
  SUPERVISEUR: 4,
  DESIGNER: 4,
  TECHNICIEN: 5,
  TECHNICIENSTOCK: 5,
  OPERATEUR: 5,
};

const VALID_ROLES = ['ADMIN', 'MANAGER', 'GL', 'TL', 'SUPERVISEUR', 'DESIGNER', 'TECHNICIEN', 'TECHNICIENSTOCK', 'OPERATEUR'];
const VALID_STATUTS = ['ACTIF', 'INACTIF'];

/** Human-readable role labels (French) */
const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  GL: 'Group Leader',
  TL: 'Team Leader',
  SUPERVISEUR: 'Superviseur',
  DESIGNER: 'Designer',
  TECHNICIEN: 'Technicien',
  TECHNICIENSTOCK: 'Technicien Stock',
  OPERATEUR: 'Opérateur',
};

// ============================================================
// Validation Functions
// ============================================================

async function checkCircularReference(userId, newManagerId, prisma) {
  let currentManagerId = newManagerId ? String(newManagerId) : null;
  const uid = userId ? String(userId) : null;
  const visited = new Set();
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  while (currentManagerId) {
    if (currentManagerId === uid) return true;
    if (visited.has(currentManagerId)) return true;
    
    if (!objectIdRegex.test(currentManagerId)) {
       break; // Invalid ID format, cannot resolve further
    }
    
    visited.add(currentManagerId);
    
    const mgr = await prisma.user.findUnique({ where: { id: currentManagerId } });
    if (!mgr) break;
    currentManagerId = mgr.managerId ? String(mgr.managerId) : null;
  }
  return false;
}

async function validateManagerAssignment(userId, managerId, targetRole, prisma) {
  if (managerId === null || managerId === undefined || managerId === '') {
    return; // Manager is optional
  }
  
  const safeManagerId = String(managerId);
  const safeUserId = userId ? String(userId) : null;

  // Validate MongoDB ObjectID format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(safeManagerId)) {
    throw new AppError(
      "Format d'ID du manager invalide.",
      400, 'INVALID_MANAGER_ID'
    );
  }

  // Self-reference check
  if (safeUserId && safeManagerId === safeUserId) {
    throw new AppError(
      "Un utilisateur ne peut pas être son propre manager.",
      400, 'INVALID_MANAGER'
    );
  }

  // Manager must exist
  const manager = await prisma.user.findUnique({ where: { id: safeManagerId } });
  if (!manager) {
    throw new AppError(
      "Le manager sélectionné n'existe pas.",
      404, 'MANAGER_NOT_FOUND'
    );
  }

  // Manager must be active
  if (manager.statut !== 'ACTIF') {
    throw new AppError(
      "Le manager sélectionné est inactif. Un manager doit être ACTIF.",
      400, 'INACTIVE_MANAGER'
    );
  }

  // Role compatibility — strict check, NO blanket ADMIN bypass
  const allowedRoles = VALID_MANAGER_ROLES[targetRole] || [];
  if (allowedRoles.length === 0) {
    throw new AppError(
      `Le rôle ${targetRole} ne peut pas avoir de manager.`,
      400, 'INVALID_MANAGER_ROLE'
    );
  }
  if (!allowedRoles.includes(manager.role)) {
    const allowedLabels = allowedRoles.map(r => ROLE_LABELS[r] || r).join(', ');
    throw new AppError(
      "Responsable invalide pour ce rôle.",
      400,
      'INVALID_MANAGER_ROLE',
      `Un ${ROLE_LABELS[targetRole] || targetRole} doit avoir un ${allowedLabels} comme responsable (reçu: ${ROLE_LABELS[manager.role] || manager.role}).`
    );
  }

  // Circular reference check
  if (safeUserId) {
    const isCircular = await checkCircularReference(safeUserId, safeManagerId, prisma);
    if (isCircular) {
      throw new AppError(
        "Hiérarchie circulaire détectée. Cette assignation est interdite.",
        400, 'CIRCULAR_HIERARCHY'
      );
    }
  }
}

module.exports = {
  VALID_MANAGER_ROLES,
  VALID_ROLES,
  VALID_STATUTS,
  ROLE_LEVEL,
  ROLE_LABELS,
  checkCircularReference,
  validateManagerAssignment
};

