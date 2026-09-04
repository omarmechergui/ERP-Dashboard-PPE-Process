const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé" });
      }

      if (user.statut === 'INACTIF') {
        return res.status(403).json({ error: "Compte inactif. Contactez l'administrateur." });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: "Non autorisé, jeton invalide ou expiré" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Non autorisé, aucun jeton fourni" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Non autorisé"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Accès refusé"
      });
    }

    next();
  };
};

module.exports = { protect, requireRole };
  