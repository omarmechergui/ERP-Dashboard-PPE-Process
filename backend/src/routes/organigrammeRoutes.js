const express = require('express');
const {
  getOrganigrammes,
  getOrganigrammeById,
  getActiveOrganigramme,
  createOrganigramme,
  updateOrganigramme,
  submitOrganigramme,
  validateOrganigramme,
  rejectOrganigramme,
  resubmitOrganigramme,
  archiveOrganigramme,
  getOrganigrammeHistory,
  cloneOrganigrammeEndpoint,
  validateHierarchy
} = require('../controllers/organigrammeController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Reading (all authenticated users)
router.get('/', getOrganigrammes);
router.get('/active', getActiveOrganigramme);
router.get('/:id', getOrganigrammeById);
router.get('/:id/history', getOrganigrammeHistory);

// Create & Edit (ADMIN, GL, SUPERVISEUR)
router.post('/', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), createOrganigramme);
router.put('/:id', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), updateOrganigramme);
router.post('/:id/clone', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), cloneOrganigrammeEndpoint);
router.post('/validate-tree', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), validateHierarchy);

// Workflow Transitions (role checks also enforced in controller)
router.patch('/:id/submit', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), submitOrganigramme);
router.patch('/:id/validate', requireRole(['ADMIN', 'GL']), validateOrganigramme);
router.patch('/:id/reject', requireRole(['ADMIN', 'GL']), rejectOrganigramme);
router.patch('/:id/resubmit', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), resubmitOrganigramme);
router.patch('/:id/archive', requireRole(['ADMIN']), archiveOrganigramme);

module.exports = router;
