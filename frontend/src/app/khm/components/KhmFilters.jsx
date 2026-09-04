"use client";

import React, { useMemo } from "react";
import { Search, Filter, Box, User } from "lucide-react";

export default function KhmFilters({
  controls,
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedProject,
  setSelectedProject,
  selectedSupervisor,
  setSelectedSupervisor
}) {
  const projects = useMemo(() => {
    const projSet = new Set(controls.map(c => c.panneau?.title_project).filter(Boolean));
    return [...projSet].sort();
  }, [controls]);

  const supervisors = useMemo(() => {
    const supSet = new Set(controls.map(c => c.matricule_superviseur).filter(Boolean));
    return [...supSet].sort();
  }, [controls]);

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row flex-wrap gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par ID panneau..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-slate-50"
        />
      </div>

      <div className="relative w-full md:w-48">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-slate-50 transition-shadow"
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En Attente</option>
          <option value="CONFORME">Conforme</option>
          <option value="NON_CONFORME">Non Conforme</option>
        </select>
      </div>

      <div className="relative w-full md:w-48">
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
      
      <div className="relative w-full md:w-48">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select
          value={selectedSupervisor}
          onChange={(e) => setSelectedSupervisor(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-slate-50 transition-shadow"
        >
          <option value="">Tous les superviseurs</option>
          {supervisors.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
