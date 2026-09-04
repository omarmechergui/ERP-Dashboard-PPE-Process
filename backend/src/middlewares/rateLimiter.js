const rateLimit = require('express-rate-limit');

// Stricter rate limit for login: 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: {
    success: false,
    error: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Slightly more relaxed limit for registration: 20 attempts per 15 minutes
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 registration requests per windowMs
  message: {
    success: false,
    error: "Trop de comptes créés à partir de cette adresse IP. Veuillez réessayer dans 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter
};
