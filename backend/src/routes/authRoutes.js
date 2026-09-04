const express = require('express');
const { login, getMe, register } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, register);
router.get('/me', protect, getMe);

module.exports = router;
