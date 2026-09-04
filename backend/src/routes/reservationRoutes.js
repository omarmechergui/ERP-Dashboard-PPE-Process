const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middlewares/auth');
const { getReservations, createReservation, validateReservation, consumeReservation, cancelReservation } = require('../controllers/reservationController');

// All routes require authentication
router.use(protect);

router.get('/', getReservations);
router.post('/', requireRole(['ADMIN', 'GL']), createReservation);
router.patch('/:id/validate', requireRole(['ADMIN', 'GL']), validateReservation);
router.patch('/:id/consume', requireRole(['ADMIN', 'GL']), consumeReservation);
router.patch('/:id/cancel', requireRole(['ADMIN', 'GL']), cancelReservation);

module.exports = router;
