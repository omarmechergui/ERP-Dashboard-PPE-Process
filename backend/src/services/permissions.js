// Centralized Role and Permissions Configuration
const ROLE_PERMISSIONS = {
  ADMIN: ['*'],
  
  MANAGER: [
    'USERS_VIEW',
    'STOCK_VIEW',
    'MAINTENANCE_VIEW',
    'MAINTENANCE_MANAGE',
    'PANNEAUX_VIEW',
    'PANNEAUX_MANAGE'
  ],
  
  GL: [
    'DASHBOARD_VIEW',
    'STOCK_VIEW',
    'BOM_VIEW',
    'PANNEAUX_VIEW',
    'PANNEAUX_MANAGE',
    'PLANIFICATION_VIEW',
    'MOUVEMENTS_VIEW',
    'MAINTENANCE_VIEW',
    'MAINTENANCE_MANAGE',
    'TECHNICIENS_VIEW',
    'FORMATION_VIEW',
    'USERS_VIEW',
    'ORGANIGRAMME_VIEW'
  ],
  
  TL: [
    'DASHBOARD_VIEW',
    'STOCK_VIEW',
    'PANNEAUX_VIEW',
    'PANNEAUX_MANAGE',
    'MAINTENANCE_VIEW',
    'MAINTENANCE_MANAGE'
  ],
  
  SUPERVISEUR: [
    'DASHBOARD_VIEW',
    'STOCK_VIEW',
    'PANNEAUX_VIEW',
    'PLANIFICATION_VIEW',
    'KHM_VIEW',
    'MAINTENANCE_VIEW',
    'MAINTENANCE_MANAGE',
    'TECHNICIENS_VIEW',
    'FORMATION_VIEW',
    'ORGANIGRAMME_VIEW'
  ],
  
  DESIGNER: [
    'PANNEAUX_VIEW',
    'PANNEAUX_MANAGE'
  ],
  
  TECHNICIEN: [
    'MAINTENANCE_VIEW',
    'MAINTENANCE_ASSIGNED',
    'PANNEAUX_VIEW'
  ],
  
  TECHNICIENSTOCK: [
    'STOCK_VIEW',
    'STOCK_MANAGE'
  ],
  
  OPERATEUR: [
    'DASHBOARD_VIEW',
    'STOCK_VIEW',
    'MOUVEMENTS_VIEW',
    'INTERVENTIONS_VIEW',
    'PREVENTIVE_VIEW'
  ]
};

function hasPermission(userRole, permission) {
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  if (permissions.includes('*')) {
    return true;
  }
  
  return permissions.includes(permission);
}

// Optional middleware creator for endpoints that need specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Non autorisé" });
    }
    
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: "Accès refusé: privilèges insuffisants" });
    }
    
    next();
  };
};

module.exports = {
  ROLE_PERMISSIONS,
  hasPermission,
  requirePermission
};
