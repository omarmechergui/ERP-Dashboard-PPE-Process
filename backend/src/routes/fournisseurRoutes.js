const express = require('express');
const {
  getFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
} = require('../controllers/fournisseurController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// Reading routes (available to any authenticated user)
router.get('/', getFournisseurs);
router.get('/:id', getFournisseurById);

// Writing routes (only GL and ADMIN)
router.post('/', requireRole(['GL', 'ADMIN']), createFournisseur);
router.put('/:id', requireRole(['GL', 'ADMIN']), updateFournisseur);
router.delete('/:id', requireRole(['GL', 'ADMIN']), deleteFournisseur);

module.exports = router;
