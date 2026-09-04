"use client";

import { AlertCircle, CheckCircle2, ChevronRight, PackageCheck, PackageOpen } from "lucide-react";

export default function CommandeTable({ 
  commandes, 
  loading, 
  selectedRowIds, 
  setSelectedRowIds, 
  onRowClick,
  onActionComplete
}) {
  
  const toggleSelection = (id, e) => {
    e.stopPropagation();
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter(rowId => rowId !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(commandes.map(c => c.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="py-3 px-4 w-12">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                onChange={toggleAll}
                checked={commandes.length > 0 && selectedRowIds.length === commandes.length}
                disabled={commandes.length === 0}
              />
            </th>
            <th className="py-3 px-4 font-semibold">Réf.</th>
            <th className="py-3 px-4 font-semibold">Fournisseur</th>
            <th className="py-3 px-4 font-semibold">Articles</th>
            <th className="py-3 px-4 font-semibold text-center">Quantité</th>
            <th className="py-3 px-4 font-semibold">Date</th>
            <th className="py-3 px-4 font-semibold text-right">Total (DT)</th>
            <th className="py-3 px-4 font-semibold text-center">Statut</th>
            <th className="py-3 px-4 font-semibold text-center">Action Suivante</th>
            <th className="py-3 px-4 font-semibold"></th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan="10" className="py-16 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <span className="font-medium">Chargement des commandes...</span>
                </div>
              </td>
            </tr>
          ) : commandes.length === 0 ? (
            <tr>
              <td colSpan="10" className="py-16 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="font-medium">Aucune commande trouvée</span>
                </div>
              </td>
            </tr>
          ) : (
            commandes.map((cmd) => (
              <tr 
                key={cmd.id} 
                onClick={() => onRowClick(cmd.id)}
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedRowIds.includes(cmd.id) ? 'bg-blue-50/50 hover:bg-blue-50' : ''
                }`}
              >
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedRowIds.includes(cmd.id)}
                    onChange={(e) => toggleSelection(cmd.id, e)}
                  />
                </td>

                <td className="py-3 px-4 font-semibold text-slate-800">
                  {cmd.reference || `CMD${String(cmd.id).padStart(3, "0")}`}
                </td>
                
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {(cmd.fournisseur?.nom || "N").substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{cmd.fournisseur?.nom || "N/A"}</span>
                  </div>
                </td>
                
                <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={cmd.lignes?.map(l => l.article?.nom || l.article?.nom_article).join(", ")}>
                  {cmd.lignes?.length > 0
                    ? cmd.lignes.map((l, idx) => (
                        <span key={idx}>
                          {l.article?.nom || l.article?.nom_article || "N/A"}
                          {idx < cmd.lignes.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "N/A"}
                </td>
                
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold">
                    {cmd.lignes?.reduce((sum, l) => sum + (l.quantite || 0), 0) || 0} pcs
                  </span>
                </td>
                
                <td className="py-3 px-4 text-slate-500 text-sm">
                  {cmd.createdAt
                    ? new Date(cmd.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' })
                    : "N/A"}
                </td>
                
                <td className="py-3 px-4 text-right font-bold text-slate-800">
                  {cmd.total?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0,00"}
                </td>
                
                <td className="py-3 px-4 text-center">
                  <StatusBadge status={cmd.status} />
                </td>
                
                <td className="py-3 px-4 text-center text-xs font-medium">
                  {cmd.status === "PENDING" ? (
                    <span className="text-blue-600 flex items-center justify-center gap-1">
                      <PackageOpen className="w-4 h-4" />
                      Recevoir
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center justify-center gap-1">
                      <PackageCheck className="w-4 h-4" />
                      Terminée
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-right text-slate-400">
                  <ChevronRight className="w-5 h-5 inline-block" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        EN ATTENTE
      </span>
    );
  }
  
  if (status === "RECEIVED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        REÇUE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      {status || "INCONNU"}
    </span>
  );
}
