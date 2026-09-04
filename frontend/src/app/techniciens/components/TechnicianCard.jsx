import React from 'react';
import { MoreHorizontal, Wrench, GraduationCap, Award, ShieldAlert, Star } from 'lucide-react';
import { UserAvatar } from '@/app/utilisateurs/components/UserAvatar';

export default function TechnicianCard({ tech, onClick }) {
  const perfRatio = tech.performance.totalInterventions > 0 
    ? (tech.performance.completedInterventions / tech.performance.totalInterventions) * 100 
    : 0;

  const totalSkills = Object.keys(tech.skills || {}).length;
  const totalFormations = tech.formations?.length || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="relative flex justify-center">
            <UserAvatar 
              user={{ photoUrl: tech.photoUrl, nom: tech.name, statut: tech.status }} 
              size="lg" 
              className="border-2 border-white shadow-sm"
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{tech.name}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{tech.position} - {tech.department}</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 focus:outline-none" onClick={onClick}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Body Stats */}
      <div className="p-5 flex-1 flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
          <div className="flex flex-col items-center">
            <Wrench className="w-4 h-4 text-slate-400 mb-1" />
            <span className="font-bold text-slate-800">{tech.performance.totalInterventions}</span>
            <span className="text-[10px] text-slate-500 uppercase">Interventions</span>
          </div>
          <div className="flex flex-col items-center">
            <GraduationCap className="w-4 h-4 text-slate-400 mb-1" />
            <span className="font-bold text-slate-800">{totalFormations}</span>
            <span className="text-[10px] text-slate-500 uppercase">Formations</span>
          </div>
          <div className="flex flex-col items-center">
            <Award className="w-4 h-4 text-slate-400 mb-1" />
            <span className="font-bold text-slate-800">{totalSkills}</span>
            <span className="text-[10px] text-slate-500 uppercase">Compétences</span>
          </div>
        </div>

        {/* Performance Bar */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
               <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Performance
            </span>
            <span className="text-xs font-bold text-slate-800">{perfRatio.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${perfRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <button 
          onClick={onClick}
          className="w-full py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          Voir Profil Complet
        </button>
      </div>
    </div>
  );
}
