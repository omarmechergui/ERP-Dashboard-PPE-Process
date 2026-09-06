/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../lib/auth';
import API from '../../lib/api';

// Components
import DashboardCards from './components/DashboardCards';
import FilterToolbar from './components/FilterToolbar';
import SkillMatrix from './components/SkillMatrix';
import TechnicianDrawer from './components/TechnicianDrawer';
import TechnicianCard from './components/TechnicianCard';
import NewTechnicianModal from './components/NewTechnicianModal';
import { Plus, LayoutGrid, Table, User } from 'lucide-react';
import LoadingState from '../../components/ui/LoadingSkeleton';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/ui/PageHeader';

export default function TechniciensPage() {
  const { user } = useAuth();
  const [techniciens, setTechniciens] = useState([]);
  const [formationCatalog, setFormationCatalog] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'matrix'

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    department: 'All',
    level: 'All',
    certStatus: 'All',
  });

  const fetchTechniciens = async () => {
    try {
      const [techRes, catRes] = await Promise.all([
        API.get('/maintenance/techniciens'),
        API.get('/maintenance/formation-catalog')
      ]);
      const apiData = techRes.data?.data?.techniciens || [];
      const catData = catRes.data?.data || [];

      if (apiData.length > 0) {
        setTechniciens(apiData);
      } else {
        setTechniciens([]);
      }
      setFormationCatalog(catData.map(c => c.name));
    } catch (err) {
      console.error('API Error:', err);
      setError('Erreur lors du chargement des techniciens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechniciens();
  }, []);

  const handleResetFilters = () => {
    setFilters({ search: '', department: 'All', level: 'All', certStatus: 'All' });
  };

  // Compute dashboard KPIs dynamically from DB
  const dashboardKPIs = useMemo(() => {
    const active = techniciens.filter(t => t.status !== 'INACTIF').length;
    const totalInt = techniciens.reduce((sum, t) => sum + (t.performance?.totalInterventions || 0), 0);
    
    let totalPerf = 0;
    let perfCount = 0;
    techniciens.forEach(t => {
       if (t.performance?.totalInterventions > 0) {
          totalPerf += (t.performance.completedInterventions / t.performance.totalInterventions) * 100;
          perfCount++;
       }
    });
    const avgPerf = perfCount > 0 ? Math.round(totalPerf / perfCount) : 0;

    return {
      totalTechnicians: techniciens.length,
      availableTechnicians: active,
      totalInterventions: totalInt,
      avgPerformance: avgPerf
    };
  }, [techniciens]);

  // Filtered data
  const filteredData = useMemo(() => {
    let data = [...techniciens];
    const SKILL_KEYS = formationCatalog.length > 0 ? formationCatalog : ['Sertissage', 'Presse Clip', 'Test', 'Electrique', 'Automatismes', 'Pneumatique'];
    const now = new Date();

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.empNumber.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
      );
    }

    // Department
    if (filters.department !== 'All') {
      data = data.filter(t => t.department === filters.department);
    }

    // Level filter
    if (filters.level !== 'All') {
      const levelMap = { 'Expert (3)': 3, 'Confirmed (2)': 2, 'Beginner (1)': 1, 'Not Trained (0)': 0 };
      const targetLvl = levelMap[filters.level];
      if (targetLvl !== undefined) {
        data = data.filter(t => {
          if (targetLvl === 0 && Object.keys(t.skills).length < SKILL_KEYS.length) return true;
          return Object.values(t.skills).some(s => s.level === targetLvl);
        });
      }
    }

    // Cert status
    if (filters.certStatus !== 'All') {
      data = data.filter(t => {
        const expirations = Object.values(t.skills).map(s => s.certExpiration).filter(Boolean);
        const hasExpired = expirations.some(d => new Date(d) < now);
        const hasExpiringSoon = expirations.some(d => { const diff = (new Date(d) - now) / (1000 * 60 * 60 * 24); return diff > 0 && diff <= 30; });
        const hasValid = expirations.some(d => new Date(d) >= now);

        if (filters.certStatus === 'Expired') return hasExpired;
        if (filters.certStatus === 'Expiring Soon') return hasExpiringSoon;
        if (filters.certStatus === 'Valid') return hasValid && !hasExpired;
        if (filters.certStatus === 'None') return expirations.length === 0;
        return true;
      });
    }

    return data;
  }, [techniciens, filters, formationCatalog]);

  // Loading state
  if (loading) return (
    <div className="w-full p-6">
      <LoadingState type="dashboard" />
    </div>
  );

  // Error state
  if (error) return (
    <div className="w-full p-6">
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6 font-sans animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <PageHeader 
          icon={User}
          title="Gestion des Techniciens"
          description="Suivi des interventions, compétences et maintenance préventive"
          action={
            <div className="flex items-center gap-3">
              <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all duration-300 ${viewMode === 'grid' ? 'bg-card shadow-sm text-primary font-bold' : 'text-secondary-foreground hover:text-foreground hover:bg-secondary'}`}
                  title="Vue Cartes"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('matrix')}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all duration-300 ${viewMode === 'matrix' ? 'bg-card shadow-sm text-primary font-bold' : 'text-secondary-foreground hover:text-foreground hover:bg-secondary'}`}
                  title="Matrice Compétences"
                >
                  <Table size={18} />
                </button>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 hover:bg-primary-hover transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} />
                <span>Nouveau</span>
              </button>
            </div>
          }
        />
      </div>

      {/* KPIs */}
      <DashboardCards data={dashboardKPIs} />

      {/* Filters */}
      <FilterToolbar filters={filters} setFilters={setFilters} onReset={handleResetFilters} />

      {/* Main Content */}
      <div className="mt-4 pb-20">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.map(tech => (
              <TechnicianCard 
                key={tech.id} 
                tech={tech} 
                onClick={() => setSelectedTech(tech)} 
              />
            ))}
            {filteredData.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                Aucun technicien ne correspond à votre recherche.
              </div>
            )}
          </div>
        ) : (
          <SkillMatrix techniciens={filteredData} onViewTech={setSelectedTech} skillKeys={formationCatalog} />
        )}
      </div>

      {/* Technician Profile Drawer */}
      <TechnicianDrawer 
        tech={selectedTech} 
        onClose={() => setSelectedTech(null)} 
        skillKeys={formationCatalog}
      />

      {/* New Technician Modal */}
      <NewTechnicianModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTechniciens();
        }}
      />
    </div>
  );
}
