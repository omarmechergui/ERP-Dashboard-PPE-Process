const prisma = require('../config/db');
const { nextSeq } = require('../helpers/counterHelper');

const STATUSES = {
  BROUILLON: 'BROUILLON',
  PLANIFIEE: 'PLANIFIEE',
  EN_PRODUCTION: 'EN_PRODUCTION',
  TERMINEE: 'TERMINEE',
  ANNULEE: 'ANNULEE'
};

const ALLOWED_TRANSITIONS = {
  [STATUSES.BROUILLON]: [STATUSES.PLANIFIEE, STATUSES.ANNULEE],
  [STATUSES.PLANIFIEE]: [STATUSES.EN_PRODUCTION, STATUSES.ANNULEE],
  [STATUSES.EN_PRODUCTION]: [STATUSES.TERMINEE],
  [STATUSES.TERMINEE]: [],
  [STATUSES.ANNULEE]: []
};

/**
 * Check if a status transition is allowed
 * @param {string} currentStatus 
 * @param {string} newStatus 
 * @returns {boolean}
 */
const canTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
};

/**
 * Validates a status transition, throws if invalid
 * @param {string} currentStatus 
 * @param {string} newStatus 
 */
const validateTransition = (currentStatus, newStatus) => {
  if (!canTransition(currentStatus, newStatus)) {
    throw new Error(`Transition non autorisée: ${currentStatus} -> ${newStatus}`);
  }
};

/**
 * Calculate actual production progress based on panneaux
 * @param {Object} planification - with panneaux relation loaded
 * @returns {number|null} Progress percentage or null if not in production
 */
const computeProgress = (planification) => {
  if (![STATUSES.EN_PRODUCTION, STATUSES.TERMINEE].includes(planification.status)) {
    return 0; // Better UX to return 0 than null for non-started ones
  }
  
  // If we have attached panneaux, calculate dynamically
  if (planification.panneaux && planification.panneaux.length > 0) {
    const completedPanneaux = planification.panneaux.filter(
      (p) => p.etat_construction === 'TERMINE'
    ).length;
    
    return Math.min(100, Math.round((completedPanneaux / planification.panneaux.length) * 100));
  }

  // Fallback to manual progress if no panneaux are attached (e.g. Mode AUCUNE)
  return planification.progress || 0;
};

/**
 * Returns allowed fields for editing based on status
 * @param {string} status 
 * @returns {string[]} Array of field names that can be edited
 */
const getEditableFields = (status) => {
  switch (status) {
    case STATUSES.BROUILLON:
      return ['title', 'project', 'customer', 'description', 'priority', 'date_debut', 'date_fin', 'matricule_gl', 'matricule_superviseur', 'bom_id', 'quantite', 'production_mode', 'progress'];
    case STATUSES.PLANIFIEE:
      return ['description', 'priority', 'date_debut', 'date_fin', 'matricule_gl', 'matricule_superviseur', 'progress'];
    case STATUSES.EN_PRODUCTION:
      return ['description', 'priority', 'date_fin', 'progress'];
    case STATUSES.TERMINEE:
    case STATUSES.ANNULEE:
      return ['description']; // Only description is editable once finished/cancelled
    default:
      return [];
  }
};

/**
 * Generate a unique reference for a new Planification (e.g. PLN-2026-001)
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
const generateReference = async (tx) => {
  const seq = await nextSeq(tx, 'planification');
  const year = new Date().getFullYear();
  return `PLN-${year}-${String(seq).padStart(3, '0')}`;
};

module.exports = {
  STATUSES,
  ALLOWED_TRANSITIONS,
  canTransition,
  validateTransition,
  computeProgress,
  getEditableFields,
  generateReference
};
