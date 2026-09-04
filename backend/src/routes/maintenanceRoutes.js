const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middlewares/auth');

const {
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
  getFormationCatalog,
  createFormationCatalog,
  createFormation,
  updateFormation,
  deleteFormation,
  getFormationById,
  getFormationHistory,
  getMachines
} = require('../controllers/maintenanceController');

const {
  getPreventiveMaintenances,
  getPreventiveMaintenanceById,
  createPreventiveMaintenance,
  updatePreventiveMaintenance,
  deletePreventiveMaintenance,
  changeStatus,
  updateChecklist,
  getKpis: getPreventiveKpis,
  getHistory: getPreventiveHistory,
  validateImport,
  confirmImport
} = require('../controllers/preventiveMaintenanceController');

// All maintenance routes are protected
router.use(protect);

// KPIs
router.get('/kpis', getKpis);

// Interventions
router.route('/interventions')
  .get(getInterventions)
  .post(requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL']), createIntervention);

router.route('/interventions/:id')
  .get(getInterventionById)
  .put(requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL']), updateIntervention)
  .delete(requireRole(['ADMIN', 'GL']), deleteIntervention);

router.patch('/interventions/:id/status', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL']), changeInterventionStatus);

// New CMMS workflow routes
router.patch('/interventions/:id/start', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL', 'TECHNICIEN']), startIntervention);
router.patch('/interventions/:id/complete', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL', 'TECHNICIEN']), completeIntervention);
router.patch('/interventions/:id/cancel', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), cancelIntervention);
router.post('/interventions/:id/parts', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL', 'TECHNICIEN']), addInterventionPart);

// Techniciens
router.route('/techniciens')
  .get(getTechniciens);

// Formation Catalog
router.route('/formation-catalog')
  .get(getFormationCatalog)
  .post(requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), createFormationCatalog);

// Formations
router.route('/formations')
  .get(getFormations)
  .post(requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), createFormation);

router.route('/formations/:id')
  .get(getFormationById)
  .put(requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), updateFormation)
  .delete(requireRole(['ADMIN', 'GL']), deleteFormation);

router.get('/formations/:id/history', getFormationHistory);

// Machines (Helper for dropdowns)
router.get('/machines', getMachines);

// Preventive Maintenance
router.get('/preventive', getPreventiveMaintenances);
router.get('/preventive/kpis', getPreventiveKpis);
router.get('/preventive/history', getPreventiveHistory);
router.get('/preventive/:id', getPreventiveMaintenanceById);
router.post('/preventive', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL']), createPreventiveMaintenance);
router.put('/preventive/:id', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL']), updatePreventiveMaintenance);
router.delete('/preventive/:id', requireRole(['ADMIN', 'GL']), deletePreventiveMaintenance);
router.patch('/preventive/:id/status', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL', 'TECHNICIEN']), changeStatus);
router.put('/preventive/:id/checklist', requireRole(['ADMIN', 'GL', 'SUPERVISEUR', 'TL', 'TECHNICIEN']), updateChecklist);
router.post('/preventive/import/validate', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), validateImport);
router.post('/preventive/import/confirm', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), confirmImport);

module.exports = router;
