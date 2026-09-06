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
  getPlanificationPanneaux
} = require('../controllers/planificationController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Read routes
router.get('/', getPlanifications);
router.get('/:id', getPlanificationById);
router.get('/:id/panneaux', getPlanificationPanneaux);
router.get('/:id/history', getPlanificationHistory);

// Write routes
router.post('/', requireRole(['GL', 'ADMIN']), createPlanification);
router.put('/:id', requireRole(['GL', 'ADMIN']), updatePlanification);

// Transition routes
router.post('/:id/planifier', requireRole(['GL', 'ADMIN']), planifierPlanification);
router.post('/:id/start', requireRole(['GL', 'ADMIN']), startProduction);
router.post('/:id/cancel', requireRole(['GL', 'ADMIN', 'SUPERVISEUR']), cancelPlanification);

// Delete route
router.delete('/:id', requireRole(['GL', 'ADMIN']), deletePlanification);

module.exports = router;
