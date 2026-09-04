"use client";

import React, { useMemo } from "react";
import { Search, Filter, Box, User } from "lucide-react";

export default function PanneauFilters({
  panneaux,
  supervisors,
  searchQuery,
  setSearchQuery,
  selectedProject,
  setSelectedProject,
  selectedSupervisor,
  setSelectedSupervisor
}) {
  const projects = useMemo(() => {
    const projSet = new Set(panneaux.map(p => p.title_project).filter(Boolean));
    return [...projSet].sort();
  }, [panneaux]);

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par ID ou nom..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-slate-50"
        />
      </div>

      <div className="relative w-full md:w-56">
        <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-slate-50 transition-shadow"
        >
          <option value="">Tous les projets</option>
          {projects.map(proj => (
            <option key={proj} value={proj}>{proj}</option>
          ))}
        </select>
      </div>
      
      <div className="relative w-full md:w-56">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select
          value={selectedSupervisor}
          onChange={(e) => setSelectedSupervisor(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-slate-50 transition-shadow"
        >
          <option value="">Tous les superviseurs</option>
          {supervisors.map(s => (
            <option key={s.matricule || s.id} value={s.matricule || s.id}>{s.nom}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
