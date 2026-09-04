export const filterEmployees = (users, filters, searchQuery) => {
  if (!users) return [];

  let result = [...users];

  // Text search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(u => 
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q))
    );
  }

  // Exact filters
  if (filters.department && filters.department !== 'Tous') {
    result = result.filter(u => u.department === filters.department);
  }
  
  if (filters.role && filters.role !== 'Tous') {
    result = result.filter(u => u.role === filters.role);
  }

  if (filters.status && filters.status !== 'Tous') {
    result = result.filter(u => u.status === filters.status);
  }

  return result;
};
