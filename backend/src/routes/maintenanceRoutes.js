const express = require('express');
const router = express.Router();
const { protect, requireRole, requirePermission } = require('../middlewares/auth');

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
router.get('/kpis', requirePermission('INTERVENTIONS_VIEW'), getKpis);

// Interventions
router.route('/interventions')
  .get(requirePermission('INTERVENTIONS_VIEW'), getInterventions)
  .post(requirePermission('INTERVENTIONS_CREATE'), createIntervention);

router.route('/interventions/:id')
  .get(requirePermission('INTERVENTIONS_VIEW'), getInterventionById)
  .put(requirePermission('INTERVENTIONS_EDIT'), updateIntervention)
  .delete(requirePermission('INTERVENTIONS_DELETE'), deleteIntervention);

router.patch('/interventions/:id/status', requirePermission('INTERVENTIONS_EDIT'), changeInterventionStatus);

// New CMMS workflow routes
router.patch('/interventions/:id/start', requirePermission('INTERVENTIONS_EDIT'), startIntervention);
router.patch('/interventions/:id/complete', requirePermission('INTERVENTIONS_EDIT'), completeIntervention);
router.patch('/interventions/:id/cancel', requirePermission('INTERVENTIONS_EDIT'), cancelIntervention);
router.post('/interventions/:id/parts', requirePermission('INTERVENTIONS_EDIT'), addInterventionPart);

// Techniciens
router.route('/techniciens')
  .get(requirePermission('TECHNICIENS_VIEW'), getTechniciens);

// Formation Catalog
router.route('/formation-catalog')
  .get(requirePermission('FORMATION_VIEW'), getFormationCatalog)
  .post(requirePermission('FORMATION_CREATE'), createFormationCatalog);

// Formations
router.route('/formations')
  .get(requirePermission('FORMATION_VIEW'), getFormations)
  .post(requirePermission('FORMATION_CREATE'), createFormation);

router.route('/formations/:id')
  .get(requirePermission('FORMATION_VIEW'), getFormationById)
  .put(requirePermission('FORMATION_EDIT'), updateFormation)
  .delete(requirePermission('FORMATION_DELETE'), deleteFormation);

router.get('/formations/:id/history', requirePermission('FORMATION_VIEW'), getFormationHistory);

// Machines (Helper for dropdowns)
router.get('/machines', requirePermission('MACHINES_VIEW'), getMachines);

// Preventive Maintenance
router.get('/preventive', requirePermission('PREVENTIVE_VIEW'), getPreventiveMaintenances);
router.get('/preventive/kpis', requirePermission('PREVENTIVE_VIEW'), getPreventiveKpis);
router.get('/preventive/history', requirePermission('PREVENTIVE_VIEW'), getPreventiveHistory);
router.get('/preventive/:id', requirePermission('PREVENTIVE_VIEW'), getPreventiveMaintenanceById);
router.post('/preventive', requirePermission('PREVENTIVE_CREATE'), createPreventiveMaintenance);
router.put('/preventive/:id', requirePermission('PREVENTIVE_EDIT'), updatePreventiveMaintenance);
router.delete('/preventive/:id', requirePermission('PREVENTIVE_DELETE'), deletePreventiveMaintenance);
router.patch('/preventive/:id/status', requirePermission('PREVENTIVE_EDIT'), changeStatus);
router.put('/preventive/:id/checklist', requirePermission('PREVENTIVE_EDIT'), updateChecklist);
router.post('/preventive/import/validate', requirePermission('PREVENTIVE_CREATE'), validateImport);
router.post('/preventive/import/confirm', requirePermission('PREVENTIVE_CREATE'), confirmImport);

module.exports = router;
