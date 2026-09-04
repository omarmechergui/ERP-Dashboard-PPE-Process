import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Users, Star } from 'lucide-react';

export default function RankingsWidget({ projectProgress = [], loading, error }) {
  const topProjects = useMemo(() => {
    return [...(projectProgress || [])]
      .sort((a, b) => b.avancement - a.avancement)
      .slice(0, 5);
  }, [projectProgress]);



  const medals = ['🥇', '🥈', '🥉'];

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 h-[390px] flex flex-col">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-6 h-6 bg-slate-100 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="w-1/2 h-3 bg-slate-100 rounded mb-2 animate-pulse" />
                  <div className="w-full h-1.5 bg-slate-100 rounded-full animate-pulse" />
                </div>
                <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-100" />
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-6 h-6 bg-slate-100 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="w-1/3 h-3 bg-slate-100 rounded mb-2 animate-pulse" />
                  <div className="w-1/4 h-2 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-rose-600 mb-1">Erreur de chargement</p>
        <p className="text-xs text-slate-500">Impossible de charger les classements.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 h-[390px]"
    >
      {/* Top Projects */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FolderKanban className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-800">Top Projets</h4>
        </div>
        <div className="space-y-2">
          {topProjects.map((p, i) => (
            <div key={p.projet} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="text-lg w-7 text-center">{medals[i] || `${i + 1}.`}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{p.projet}</p>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.avancement}%` }}
                    transition={{ duration: 1, delay: 0.8 + i * 0.15 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800">{p.avancement}%</span>
            </div>
          ))}
          {topProjects.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Aucun projet</p>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-slate-100" />


    </motion.div>
  );
}
