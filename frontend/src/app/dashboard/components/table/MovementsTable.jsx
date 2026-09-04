import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Search, ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function MovementsTable({ recentMovements = [], loading, error }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const filtered = useMemo(() => {
    if (!searchTerm) return recentMovements || [];
    const lower = searchTerm.toLowerCase();
    return (recentMovements || []).filter(m =>
      m.article_id?.toLowerCase().includes(lower) ||
      m.article?.nom_article?.toLowerCase().includes(lower) ||
      m.type?.toLowerCase().includes(lower) ||
      m.emplacement?.toLowerCase().includes(lower)
    );
  }, [recentMovements, searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div>
              <div className="w-40 h-4 bg-slate-100 rounded animate-pulse mb-1.5" />
              <div className="w-56 h-3 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-full md:w-72 h-9 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div className="w-full h-8 bg-slate-100 rounded animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full h-12 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-6">
        <p className="text-sm font-semibold text-rose-600 mb-1">Erreur de chargement</p>
        <p className="text-xs text-slate-500">Impossible de charger l'historique des mouvements.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-100 p-2 rounded-xl">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Dernières Transactions</h4>
            <p className="text-xs text-slate-400">Historique des mouvements de stock</p>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher article, type, emplacement..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full border-collapse text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Article</th>
              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Emplacement</th>
              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantité</th>
              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Détails / Reste</th>
              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length > 0 ? paginated.map((m) => (
              <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    m.type === 'ENTREE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {m.type === 'ENTREE' ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                    {m.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                  </span>
                </td>
                <td className="p-3">
                  <p className="font-semibold text-slate-800">{m.article_id}</p>
                  <p className="text-xs text-slate-400">{m.article?.nom_article}</p>
                </td>
                <td className="p-3 font-mono text-xs text-slate-500">{m.emplacement}</td>
                <td className="p-3 font-bold text-slate-800">{m.quantite}</td>
                <td className="p-3 text-xs text-slate-500">
                  {m.type === 'ENTREE' ? (
                    <span>
                      PO: {m.po_reference || '—'} | Reçu:{' '}
                      <span className={m.etat ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                        {m.etat ? 'Oui' : 'Non'}
                      </span>
                    </span>
                  ) : (
                    <span>
                      Mat: {m.matricule} | Reste: <strong className="text-slate-700">{m.reste}</strong>
                    </span>
                  )}
                </td>
                <td className="p-3 text-xs text-slate-400">
                  {new Date(m.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="p-10 text-center text-slate-400">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Aucun mouvement de stock trouvé</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500">
            Page {page + 1} / {totalPages} — {filtered.length} résultats
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
