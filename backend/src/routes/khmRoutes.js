const express = require('express');
const {
  getKhmControls,
  getKhmControlById,
  syncKhmControls,
  createKhmControl,
  validerKhm,
  rejeterKhm,
} = require('../controllers/khmController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// KHM Reading (All authenticated users)
router.get('/', getKhmControls);
router.get('/:id', getKhmControlById);

// KHM Actions (Superviseur and Admin)
router.post('/sync', requireRole(['ADMIN']), syncKhmControls);
router.post('/', requireRole(['SUPERVISEUR', 'ADMIN']), createKhmControl);
router.patch('/:id/valider', requireRole(['SUPERVISEUR', 'ADMIN']), validerKhm);
router.patch('/:id/rejeter', requireRole(['SUPERVISEUR', 'ADMIN']), rejeterKhm);

module.exports = router;
