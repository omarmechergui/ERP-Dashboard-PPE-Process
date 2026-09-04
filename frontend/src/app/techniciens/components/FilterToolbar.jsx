'use client';
import React from 'react';
import { Search, FilterX } from 'lucide-react';

export default function FilterToolbar({ filters, setFilters, onReset }) {
  const departments = ['All', 'Assemblage', 'Qualité', 'Maintenance', 'Production', 'Logistique'];
  const levels = ['All', 'Expert (3)', 'Confirmed (2)', 'Beginner (1)', 'Not Trained (0)'];
  const certStatuses = ['All', 'Valid', 'Expired', 'Expiring Soon', 'None'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const selectBase = 'px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 min-w-0';

  return (
    <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">

        {/* Search */}
        <div className="relative flex-1 min-w-0 lg:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search technician..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 flex-1">
          <select name="department" value={filters.department} onChange={handleChange} className={selectBase}>
            {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'Department' : d}</option>)}
          </select>

          <select name="level" value={filters.level} onChange={handleChange} className={selectBase}>
            {levels.map(l => <option key={l} value={l}>{l === 'All' ? 'Skill Level' : l}</option>)}
          </select>

          <select name="certStatus" value={filters.certStatus} onChange={handleChange} className={selectBase}>
            {certStatuses.map(s => <option key={s} value={s}>{s === 'All' ? 'Certification' : s}</option>)}
          </select>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
            title="Reset Filters"
          >
            <FilterX size={15} />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
