"use client";

import { AlertCircle, CheckCircle2, ChevronRight, ShieldCheck, ShoppingBag, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  EN_ATTENTE: { label: "EN ATTENTE", dotColor: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", pulse: true },
  VALIDEE:    { label: "VALIDÉE",    dotColor: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  CONSUMED:   { label: "CONSOMMÉE",  dotColor: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: ShoppingBag },
  TERMINE:    { label: "TERMINÉE",   dotColor: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: CheckCircle2 },
  ANNULEE:    { label: "ANNULÉE",    dotColor: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || "INCONNU", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      {cfg.pulse ? <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} animate-pulse`} /> : Icon ? <Icon className="w-3.5 h-3.5" /> : null}
      {cfg.label}
    </span>
  );
}

function NextAction({ status }) {
  if (status === "EN_ATTENTE") {
    return (
      <span className="text-blue-600 flex items-center justify-center gap-1">
        <ShieldCheck className="w-4 h-4" />
        Valider
      </span>
    );
  }
  if (status === "VALIDEE") {
    return (
      <span className="text-violet-600 flex items-center justify-center gap-1">
        <ShoppingBag className="w-4 h-4" />
        Consommer
      </span>
    );
  }
  return <span className="text-slate-400 text-xs">—</span>;
}

export default function ReservationTable({
  reservations,
  loading,
  selectedRowIds,
  setSelectedRowIds,
  onRowClick,
  onActionComplete,
  isWriteAllowed,
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
      setSelectedRowIds(reservations.map(r => r.id));
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
                checked={reservations.length > 0 && selectedRowIds.length === reservations.length}
                disabled={reservations.length === 0}
              />
            </th>
            <th className="py-3 px-4 font-semibold">Réf.</th>
            <th className="py-3 px-4 font-semibold">Client</th>
            <th className="py-3 px-4 font-semibold">Articles</th>
            <th className="py-3 px-4 font-semibold text-center">Qté totale</th>
            <th className="py-3 px-4 font-semibold text-right">Total (DT)</th>
            <th className="py-3 px-4 font-semibold text-center">Statut</th>
            <th className="py-3 px-4 font-semibold text-center">Action Suivante</th>
            <th className="py-3 px-4 font-semibold">Date</th>
            <th className="py-3 px-4 font-semibold"></th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan="10" className="py-16 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <span className="font-medium">Chargement des réservations...</span>
                </div>
              </td>
            </tr>
          ) : reservations.length === 0 ? (
            <tr>
              <td colSpan="10" className="py-16 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="font-medium">Aucune réservation trouvée</span>
                  <p className="text-sm text-slate-400">Modifiez vos filtres ou créez une nouvelle réservation.</p>
                </div>
              </td>
            </tr>
          ) : (
            reservations.map(r => (
              <tr
                key={r.id}
                onClick={() => onRowClick(r.id)}
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedRowIds.includes(r.id) ? 'bg-blue-50/50 hover:bg-blue-50' : ''
                }`}
              >
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedRowIds.includes(r.id)}
                    onChange={e => toggleSelection(r.id, e)}
                  />
                </td>

                <td className="py-3 px-4 font-semibold text-slate-800">
                  {r.reference}
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {(r.client || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{r.client || "N/A"}</span>
                  </div>
                </td>

                <td className="py-3 px-4 text-slate-500 max-w-[220px]">
                  <div className="flex flex-wrap gap-1">
                    {r.lignes?.slice(0, 2).map((l, i) => (
                      <span key={i} className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium truncate max-w-[100px]">
                        {l.article?.nom_article || l.article_id}
                      </span>
                    ))}
                    {r.lignes?.length > 2 && (
                      <span className="inline-block bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-medium">
                        +{r.lignes.length - 2}
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold">
                    {r.lignes?.reduce((s, l) => s + (l.quantite || 0), 0) || 0}
                  </span>
                </td>

                <td className="py-3 px-4 text-right font-bold text-slate-800">
                  {r.total?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0,00"}
                </td>

                <td className="py-3 px-4 text-center">
                  <StatusBadge status={r.status} />
                </td>

                <td className="py-3 px-4 text-center text-xs font-medium">
                  <NextAction status={r.status} />
                </td>

                <td className="py-3 px-4 text-slate-500 text-sm">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' })
                    : "N/A"}
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
