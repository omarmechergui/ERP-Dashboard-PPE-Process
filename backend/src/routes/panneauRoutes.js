const express = require('express');
const {
  getPanneaux,
  getPanneauById,
  getPanneauHistory,
  createPanneau,
  updatePanneau,
  deletePanneau,
  patchEtat,
} = require('../controllers/panneauController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// Panel Reading (All roles)
router.get('/', getPanneaux);
router.get('/:id', getPanneauById);
router.get('/:id/history', getPanneauHistory);

// Panel Mutations (Superviseur & Admin)
router.post('/', requireRole(['SUPERVISEUR', 'ADMIN']), createPanneau);
router.put('/:id', requireRole(['SUPERVISEUR', 'ADMIN']), updatePanneau);
router.delete('/:id', requireRole(['SUPERVISEUR', 'ADMIN']), deletePanneau);
router.patch('/:id/etat', requireRole(['SUPERVISEUR', 'ADMIN']), patchEtat);

module.exports = router;
