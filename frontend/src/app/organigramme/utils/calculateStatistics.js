export const calculateStatistics = (users = []) => {
  if (!Array.isArray(users)) return null;

  const total = users.length;
  const active = users.filter(u => u.status === 'Active' || u.status === 'Actif').length;
  const inactive = users.filter(u => u.status === 'Inactive' || u.status === 'Inactif' || u.status === 'Suspended').length;
  const managers = users.filter(u => users.some(other => other.managerId === u.id)).length;
  
  // Get unique departments
  const departments = new Set(users.map(u => u.department).filter(Boolean)).size;
  
  const technicians = users.filter(u => u.position?.toLowerCase().includes('technicien') || u.role?.toLowerCase().includes('technicien')).length;

  return {
    total,
    active,
    inactive,
    managers,
    departments,
    technicians
  };
};
