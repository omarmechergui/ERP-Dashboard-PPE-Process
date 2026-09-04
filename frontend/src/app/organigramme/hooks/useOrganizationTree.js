import { useState, useEffect, useCallback, useMemo } from 'react';
import { organigrammeService } from '../services/organigrammeService';
import { buildTree } from '../utils/treeBuilder';
import { calculateStatistics } from '../utils/calculateStatistics';
import { filterEmployees } from '../utils/searchEmployees';

export function useOrganizationTree() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    department: 'Tous',
    role: 'Tous',
    status: 'Tous',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organigrammeService.getUsers();
      setUsers(data);
      
      // Auto-expand top levels (roots)
      const roots = buildTree(data);
      const newExpanded = new Set();
      roots.forEach(r => newExpanded.add(r.id));
      setExpandedNodes(newExpanded);
      
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement de l'organigramme.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await organigrammeService.getUsers();
        if (!cancelled) {
          setUsers(data);
          // Auto-expand top levels (roots)
          const roots = buildTree(data);
          const newExpanded = new Set();
          roots.forEach(r => newExpanded.add(r.id));
          setExpandedNodes(newExpanded);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Erreur lors du chargement de l'organigramme.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleNode = useCallback((id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const openEmployeeDrawer = useCallback((employee) => {
    setSelectedEmployee(employee);
    setIsDrawerOpen(true);
  }, []);

  const closeEmployeeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedEmployee(null);
  }, []);

  const handleUpdateManager = useCallback(async (employeeId, newManagerId) => {
    try {
      await organigrammeService.updateManager(employeeId, newManagerId);
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === employeeId ? { ...u, managerId: newManagerId } : u));
    } catch (err) {
      console.error('Update manager failed', err);
    }
  }, []);

  // Compute derived state
  const stats = useMemo(() => calculateStatistics(users), [users]);
  
  const treeData = useMemo(() => {
    const filtered = filterEmployees(users, filters, searchQuery);
    // If filtering is active, we might want to just show the flat list or a filtered tree.
    // Here we rebuild the tree from the filtered nodes, but we might lose parents if they are filtered out.
    // For a real org chart, filtering usually highlights nodes instead of removing them, 
    // or we flatten. For simplicity, we just rebuild.
    return buildTree(filtered);
  }, [users, filters, searchQuery]);

  return {
    users,
    treeData,
    stats,
    loading,
    error,
    refreshData: fetchUsers,
    
    // Search & Filter
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    
    // Node state
    expandedNodes,
    toggleNode,
    
    // Drawer
    isDrawerOpen,
    selectedEmployee,
    openEmployeeDrawer,
    closeEmployeeDrawer,
    
    // Admin Actions
    handleUpdateManager
  };
}
