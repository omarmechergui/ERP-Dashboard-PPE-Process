const express = require('express');
const {
  getPlanifications,
  getPlanificationById,
  createPlanification,
  updatePlanification,
  planifierPlanification,
  startProduction,
  cancelPlanification,
  deletePlanification,
  getPlanificationHistory,
  getDashboardStats,
  getPlanificationPanneaux,
  completePlanification,
  updateProgress,
  addPanneauToPlanification,
  removePanneauFromPlanification
} = require('../controllers/planificationController');
const { protect, requirePermission } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(requirePermission('PLANIFICATION_VIEW'));

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Read routes
router.get('/', getPlanifications);
router.get('/:id', getPlanificationById);
router.get('/:id/panneaux', getPlanificationPanneaux);
router.get('/:id/history', getPlanificationHistory);

// Write routes
router.post('/', requirePermission('PLANIFICATION_CREATE'), createPlanification);
router.put('/:id', requirePermission('PLANIFICATION_EDIT'), updatePlanification);

// Transition routes
router.post('/:id/planifier', requirePermission('PLANIFICATION_EDIT'), planifierPlanification);
router.post('/:id/start', requirePermission('PLANIFICATION_EDIT'), startProduction);
router.post('/:id/complete', requirePermission('PLANIFICATION_EDIT'), completePlanification);
router.post('/:id/cancel', requirePermission('PLANIFICATION_EDIT'), cancelPlanification);
router.patch('/:id/progress', requirePermission('PLANIFICATION_EDIT'), updateProgress);

// Panneaux management
router.post('/:id/panneaux', requirePermission('PLANIFICATION_EDIT'), addPanneauToPlanification);
router.delete('/:id/panneaux/:panneauId', requirePermission('PLANIFICATION_EDIT'), removePanneauFromPlanification);

// Delete route
router.delete('/:id', requirePermission('PLANIFICATION_DELETE'), deletePlanification);

module.exports = router;
