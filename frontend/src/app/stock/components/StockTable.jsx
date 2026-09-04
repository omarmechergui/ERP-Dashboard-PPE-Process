import React from "react";
import { Edit3, ChevronRight, PackageSearch, Trash2 } from "lucide-react";
import { StockStatusBadge } from "./StockStatusBadge";
import { StockQuantityBar } from "./StockQuantityBar";
import { formatCurrency, formatQuantity } from "../utils/stockFormatters";

export const StockTable = ({ articles, loading, pagination, onPageChange, limit, onLimitChange, isWriteAllowed, onEdit, onDelete, onRowClick }) => {
  if (articles.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <PackageSearch className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">No articles found</h3>
        <p className="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50/80 backdrop-blur-sm text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="p-4 w-24">ID</th>
              <th className="p-4">Article Name</th>
              <th className="p-4">Supplier</th>
              <th className="p-4 w-32">Location</th>
              <th className="p-4 w-32 text-right">Unit Price</th>
              <th className="p-4 w-48">Stock Level</th>
              <th className="p-4 w-32 text-center">Status</th>
              <th className="p-4 w-24 text-right">Total</th>
              <th className="p-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              Array.from({ length: limit || 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                  <td className="p-4"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  <td className="p-4"></td>
                </tr>
              ))
            ) : (
              articles.map((art, idx) => (
                <tr
                  key={art.uniqueId || `${art.id}-${idx}`}
                  onClick={() => onRowClick(art)}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-mono font-medium text-slate-500">
                    {art.id}
                  </td>
                  <td className="p-4 font-semibold text-slate-900">
                    {art.nom_article}
                  </td>
                  <td className="p-4 text-slate-500 truncate max-w-[150px]" title={art.fournisseur?.nom}>
                    {art.fournisseur?.nom || "-"}
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-xs">
                    <span className="bg-slate-100 px-2 py-1 rounded-md">{art.address || "N/A"}</span>
                  </td>
                  <td className="p-4 font-mono text-right text-slate-600">
                    {formatCurrency(art.prix)}
                  </td>
                  <td className="p-4">
                    <StockQuantityBar 
                      current={((art.quantite || 0) - (art.quantite_reservee || 0))} 
                      min={art.min_stock || 10} 
                    />
                  </td>
                  <td className="p-4 text-center">
                    <StockStatusBadge article={art} />
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900 text-right">
                    {(art.quantite || 0)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isWriteAllowed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(art);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      {isWriteAllowed && onDelete && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'article ${art.id} (${art.nom_article}) ?`)) {
                              try {
                                await onDelete(art.id);
                                alert(`Article ${art.id} supprimé avec succès.`);
                              } catch (err) {
                                const status = err?.response?.status;
                                const data = err?.response?.data;

                                if (status === 409 && data?.dependencies) {
                                  const depLabels = {
                                    mouvementsStock: 'Mouvements de stock',
                                    bomLines: 'Lignes BOM',
                                    reservationLignes: 'Réservations',
                                    commandeLignes: 'Lignes de commande',
                                    panneauScraps: 'Rebuts panneau',
                                    stockLocations: 'Emplacements stock',
                                    interventionParts: 'Pièces d\'intervention',
                                  };
                                  const details = Object.entries(data.dependencies)
                                    .map(([key, count]) => `• ${depLabels[key] || key}: ${count} enregistrement(s)`)
                                    .join('\n');
                                  alert(`${data.error}\n\n${data.reason}\n\n${details}`);
                                } else {
                                  alert(err.message || `Erreur lors de la suppression de l'article ${art.id}.`);
                                }
                              }
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
            </div>
            {onLimitChange && (
              <select 
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="text-sm border border-slate-300 rounded-md bg-white py-1 px-2 focus:outline-none focus:border-blue-500"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
