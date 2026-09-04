const express = require('express');
const {
  getBoms,
  getBomById,
  createBom,
  updateBom,
  deleteBom,
  getBomLines,
  addBomLine,
  updateBomLine,
  deleteBomLine,
  importBomLinesBulk,
  getBomStats
} = require('../controllers/bomController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// BOM Reading (All roles)
router.get('/', getBoms);
router.get('/stats/summary', getBomStats);
router.get('/:id', getBomById);
router.get('/:id/lignes', getBomLines);

// BOM Mutations (GL & Admin)
router.post('/', requireRole(['GL', 'ADMIN']), createBom);
router.put('/:id', requireRole(['GL', 'ADMIN']), updateBom);
router.delete('/:id', requireRole(['GL', 'ADMIN']), deleteBom);

// BOM Lines Mutations (GL & Admin)
router.post('/:id/lignes', requireRole(['GL', 'ADMIN']), addBomLine);
router.put('/:id/lignes/:lineId', requireRole(['GL', 'ADMIN']), updateBomLine);
router.delete('/:id/lignes/:lineId', requireRole(['GL', 'ADMIN']), deleteBomLine);
router.post('/:id/lignes/bulk', requireRole(['GL', 'ADMIN']), importBomLinesBulk);

module.exports = router;
