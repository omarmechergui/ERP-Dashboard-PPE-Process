// ============================================================
// Role ordering — mirrors backend/src/services/userHierarchy.js
// ============================================================
const ROLE_LEVEL = {
  ADMIN: 0, MANAGER: 1, GL: 2, TL: 3,
  SUPERVISEUR: 4, DESIGNER: 4,
  TECHNICIEN: 5, TECHNICIENSTOCK: 5, OPERATEUR: 5,
};

export const buildTree = (users) => {
  if (!users || !Array.isArray(users)) return [];

  const map = {};
  const roots = [];

  // Initialize mapping and format for UI
  users.forEach(u => {
    map[u.id] = {
      ...u,
      firstName: u.nom ? u.nom.split(' ')[0] : 'Inconnu',
      lastName: u.nom ? u.nom.split(' ').slice(1).join(' ') : '',
      position: u.role,
      department: u.department || 'N/A',
      status: u.statut === 'ACTIF' ? 'Active' : 'Inactive',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nom || 'User')}&background=random`,
      children: []
    };
  });

  // Build the tree strictly using managerId
  users.forEach(user => {
    if (user.managerId && map[user.managerId]) {
      map[user.managerId].children.push(map[user.id]);
    } else {
      roots.push(map[user.id]);
    }
  });

  // Sort children by role level, then alphabetically
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => {
      const levelDiff = (ROLE_LEVEL[a.role] ?? 99) - (ROLE_LEVEL[b.role] ?? 99);
      if (levelDiff !== 0) return levelDiff;
      return (a.nom || '').localeCompare(b.nom || '');
    });
    nodes.forEach(node => {
      if (node.children?.length) sortChildren(node.children);
    });
  };

  sortChildren(roots);

  return roots;
};

export const getSubordinatesCount = (node) => {
  if (!node.children || node.children.length === 0) return 0;
  
  let count = node.children.length;
  node.children.forEach(child => {
    count += getSubordinatesCount(child);
  });
  
  return count;
};

