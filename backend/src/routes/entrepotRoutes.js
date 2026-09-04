const express = require('express');
const {
  getEntrepots,
  createEntrepot,
  updateEntrepot,
  deleteEntrepot,
} = require('../controllers/entrepotController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// Warehouse Reading (All roles)
router.get('/', getEntrepots);

// Warehouse Mutations (GL & Admin)
router.post('/', requireRole(['GL', 'ADMIN']), createEntrepot);
router.put('/:id', requireRole(['GL', 'ADMIN']), updateEntrepot);
router.delete('/:id', requireRole(['GL', 'ADMIN']), deleteEntrepot);

module.exports = router;
