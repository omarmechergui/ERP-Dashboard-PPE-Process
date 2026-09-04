const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé: privilèges insuffisants" });
    }

    next();
  };
};

module.exports = requireRole;
