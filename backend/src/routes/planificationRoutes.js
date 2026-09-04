const express = require('express');
const {
  getDashboardStats,
  getPlanifications,
  getPlanificationById,
  getPlanificationPanneaux,
  getPlanificationHistory,
  createPlanification,
  updatePlanification,
  updatePlanificationStatus,
  deletePlanification,
} = require('../controllers/planificationController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Planification Reading (All roles)
router.get('/', getPlanifications);
router.get('/:id', getPlanificationById);
router.get('/:id/panneaux', getPlanificationPanneaux);
router.get('/:id/history', getPlanificationHistory);

// Planification Mutations (GL & Admin)
router.post('/', requireRole(['GL', 'ADMIN']), createPlanification);
router.put('/:id', requireRole(['GL', 'ADMIN']), updatePlanification);
router.patch('/:id/status', requireRole(['GL', 'ADMIN', 'SUPERVISEUR']), updatePlanificationStatus);
router.delete('/:id', requireRole(['GL', 'ADMIN']), deletePlanification);

module.exports = router;
