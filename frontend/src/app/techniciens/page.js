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
import { Plus, LayoutGrid, Table } from 'lucide-react';

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 animate-pulse h-64" />
    </div>
  );

  // Error state
  if (error) return (
    <div className="w-full p-6">
      <div className="bg-rose-50 border border-rose-200 text-rose-600 p-6 rounded-xl text-center">
        <p className="font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 px-4 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-4 md:p-6 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-4 border-b border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Gestion des Techniciens</h1>
            <p className="text-xs text-slate-500 mt-0.5">Suivi des interventions, compétences et maintenance préventive</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-200/60 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vue Cartes"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('matrix')}
                className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'matrix' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Matrice des Compétences"
              >
                <Table size={18} />
              </button>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={16} />
              Nouveau Technicien
            </button>
          </div>
        </div>
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
