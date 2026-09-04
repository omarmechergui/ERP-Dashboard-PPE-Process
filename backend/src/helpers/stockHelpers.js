/**
 * Calculate the effective minimum stock level for an article
 * based on the sum of its BOM (Bill of Materials) line quantities.
 *
 * @param {{ quantite: number }[]} bomLines - Array of BOM lines with quantities
 * @returns {number} The calculated minimum stock threshold
 */
const calculateEffectiveMinStock = (bomLines) => {
  if (!bomLines || !Array.isArray(bomLines)) return 0;
  return bomLines.reduce((sum, ligne) => sum + ligne.quantite, 0);
};

const TECHNICIEN_ROLES = ['TECHNICIEN', 'TECHNICIENSTOCK'];

/**
 * Check whether a user role represents a technician.
 *
 * @param {string} role
 * @returns {boolean}
 */
const isTechnicianRole = (role) => {
  return TECHNICIEN_ROLES.includes(role);
};

module.exports = {
  calculateEffectiveMinStock,
  isTechnicianRole,
  TECHNICIEN_ROLES,
};
