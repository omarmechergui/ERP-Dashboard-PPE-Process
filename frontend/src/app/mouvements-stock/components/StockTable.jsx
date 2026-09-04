import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, PackageSearch, AlertCircle } from "lucide-react";
import { getMovementTypeDetails, formatMovementDate } from "../utils/movementHelpers";

export const StockTable = ({ movements, onRowClick, pagination, onPageChange, onLimitChange }) => {
  if (movements.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <PackageSearch className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">No movements found</h3>
        <p className="text-sm text-slate-500">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50/80 backdrop-blur-sm text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="p-4 w-32">Date</th>
              <th className="p-4 w-40">Type</th>
              <th className="p-4">Article</th>
              <th className="p-4 w-32">Location</th>
              <th className="p-4 w-28 text-right">Qty</th>
              <th className="p-4 w-32">Operator / PO</th>
              <th className="p-4 w-28 text-center">Status</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <AnimatePresence>
              {movements.map((m, idx) => {
                const typeDetails = getMovementTypeDetails(m.type);
                const isEntry = m.type === "ENTREE";
                
                return (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
                    onClick={() => onRowClick(m)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {formatMovementDate(m.createdAt)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${typeDetails.bg} ${typeDetails.color} ${typeDetails.border}`}>
                        {typeDetails.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{m.article_id}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={m.article?.nom_article}>
                        {m.article?.nom_article || "Unknown Article"}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-500 text-xs">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">{m.emplacement || "N/A"}</span>
                    </td>
                    <td className={`p-4 font-mono font-bold text-right ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isEntry ? "+" : "-"}{m.quantite}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600 truncate max-w-[150px]">
                      {m.matricule || m.po_reference || "-"}
                    </td>
                    <td className="p-4 text-center">
                      {m.etat === false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity inline-block" />
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-slate-900">{pagination.total}</span> results
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Per page:</span>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  onLimitChange(Number(e.target.value));
                  onPageChange(1); // Reset to page 1 on limit change
                }}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // Logic to show pages around current page
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                      pagination.page === pageNum 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                        : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                <span className="text-slate-400 px-1">...</span>
              )}
            </div>
            
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
