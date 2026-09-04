/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Package, Clock, AlertTriangle, CheckCircle2, ShieldCheck, ShoppingBag, XCircle, FileText } from "lucide-react";
import API from "@/lib/api";

const STATUS_CONFIG = {
  EN_ATTENTE: { label: "EN ATTENTE", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  VALIDEE:    { label: "VALIDÉE",    bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  CONSUMED:   { label: "CONSOMMÉE",  bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  TERMINE:    { label: "TERMINÉE",   bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  ANNULEE:    { label: "ANNULÉE",    bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
};

export default function ReservationDetailsDrawer({ reservationId, reservations, onClose, onUpdate, isWriteAllowed }) {
  const [actionLoading, setActionLoading] = useState(null);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Find reservation from the already-fetched list (avoids extra API call since there's no GET /reservations/:id)
  const reservation = useMemo(() => {
    return reservations?.find(r => r.id === reservationId) || null;
  }, [reservations, reservationId]);

  // Fetch stock info for each article in the reservation
  useEffect(() => {
    if (!reservation?.lignes?.length) {
      setArticlesLoading(false);
      return;
    }

    const fetchArticleStock = async () => {
      setArticlesLoading(true);
      try {
        const articleIds = [...new Set(reservation.lignes.map(l => l.article_id))];
        const results = await Promise.all(
          articleIds.map(async (id) => {
            try {
              const res = await API.get(`/stock/articles/${id}`);
              return res.data;
            } catch {
              return null;
            }
          })
        );
        setArticles(results.filter(Boolean));
      } catch (err) {
        console.error(err);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchArticleStock();
  }, [reservation]);

  const handleAction = async (action) => {
    const labels = {
      validate: "valider",
      consume: "consommer le stock réservé pour",
      cancel: "annuler",
    };
    if (!confirm(`Êtes-vous sûr de vouloir ${labels[action]} cette réservation ?`)) return;

    setActionLoading(action);
    try {
      await API.patch(`/reservations/${reservationId}/${action}`);
      onUpdate();
      onClose();
    } catch (err) {
      const msg = err?.error || err?.message || `Erreur lors de l'opération.`;
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const statusCfg = STATUS_CONFIG[reservation?.status] || STATUS_CONFIG.EN_ATTENTE;

  // Build stock readiness per article
  const stockReadiness = useMemo(() => {
    if (!reservation?.lignes || articles.length === 0) return [];
    return reservation.lignes.map(ligne => {
      const article = articles.find(a => a.id === ligne.article_id);
      if (!article) return { ...ligne, available: 0, reserved: 0, missing: ligne.quantite, status: "UNKNOWN" };

      const available = article.quantite - (article.reserved_qty || 0);
      const missing = Math.max(0, ligne.quantite - available);
      let status = "READY";
      if (missing >= ligne.quantite) status = "BLOCKED";
      else if (missing > 0) status = "PARTIAL";

      return {
        ...ligne,
        articleName: article.nom_article,
        available,
        reserved: article.reserved_qty || 0,
        totalStock: article.quantite,
        missing,
        status,
        stockLocations: article.stockLocations || [],
      };
    });
  }, [reservation, articles]);

  const overallReadiness = useMemo(() => {
    if (stockReadiness.length === 0) return null;
    const ready = stockReadiness.filter(s => s.status === "READY").length;
    const partial = stockReadiness.filter(s => s.status === "PARTIAL").length;
    const blocked = stockReadiness.filter(s => s.status === "BLOCKED").length;
    return { ready, partial, blocked, total: stockReadiness.length };
  }, [stockReadiness]);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-800">
                {reservation?.reference || "Détails"}
              </h2>
              {reservation && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border} shadow-sm`}>
                  {statusCfg.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              Client: {reservation?.client || "..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {!reservation ? (
            <div className="text-center py-20 text-rose-500 flex flex-col items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              Réservation introuvable.
            </div>
          ) : (
            <>
              {/* Workflow Timeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Progression
                </h3>
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                  <div className="space-y-5 relative z-10">
                    <TimelineStep
                      label="Demande créée"
                      detail={`Le ${new Date(reservation.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric' })}`}
                      done={true}
                    />
                    <TimelineStep
                      label="Stock réservé (Validée)"
                      detail={reservation.status === "EN_ATTENTE" ? "En attente de validation" : "Stock réservé avec succès"}
                      done={["VALIDEE", "CONSUMED", "TERMINE"].includes(reservation.status)}
                      current={reservation.status === "EN_ATTENTE"}
                    />
                    <TimelineStep
                      label="Stock consommé"
                      detail={reservation.status === "CONSUMED" || reservation.status === "TERMINE" ? "Stock physique déduit" : "En attente de consommation"}
                      done={["CONSUMED", "TERMINE"].includes(reservation.status)}
                      current={reservation.status === "VALIDEE"}
                    />
                    <TimelineStep
                      label="Terminée"
                      detail={reservation.status === "TERMINE" ? "Processus terminé" : ""}
                      done={reservation.status === "TERMINE"}
                    />
                    {reservation.status === "ANNULEE" && (
                      <TimelineStep
                        label="Annulée"
                        detail="La réservation a été annulée"
                        done={true}
                        error={true}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Readiness */}
              {overallReadiness && reservation.status === "EN_ATTENTE" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" /> Disponibilité Stock
                  </h3>

                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600">{overallReadiness.ready} disponibles</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="text-slate-600">{overallReadiness.partial} partiels</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600">{overallReadiness.blocked} insuffisants</span>
                    </div>
                  </div>

                  {/* Per-article readiness */}
                  <div className="space-y-3">
                    {stockReadiness.map((item, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${
                        item.status === "READY" ? "bg-emerald-50 border-emerald-200" :
                        item.status === "PARTIAL" ? "bg-amber-50 border-amber-200" :
                        "bg-rose-50 border-rose-200"
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-slate-800">{item.articleName || item.article_id}</span>
                          <span className={`text-xs font-bold ${
                            item.status === "READY" ? "text-emerald-700" :
                            item.status === "PARTIAL" ? "text-amber-700" :
                            "text-rose-700"
                          }`}>
                            {item.status === "READY" ? "DISPONIBLE" : item.status === "PARTIAL" ? "PARTIEL" : "INSUFFISANT"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mt-2">
                          <div>Demandé: <span className="font-bold text-slate-800">{item.quantite}</span></div>
                          <div>Disponible: <span className="font-bold text-slate-800">{item.available}</span></div>
                          <div>Manquant: <span className={`font-bold ${item.missing > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{item.missing}</span></div>
                        </div>

                        {/* Stock Locations */}
                        {item.stockLocations && item.stockLocations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200/50">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Emplacements:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.stockLocations.map((loc, j) => (
                                <span key={j} className="text-xs bg-white/80 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                  {loc.location}: <span className="font-bold">{loc.quantite}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles Summary */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Articles réservés
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Article</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Quantité</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Prix U.</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservation.lignes?.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {l.article?.nom_article || "N/A"}
                            <div className="text-xs text-slate-500 font-normal">ID: {l.article_id}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-600">{l.quantite}</td>
                          <td className="py-3 px-4 text-right text-slate-500">{l.prix?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-800">{(l.quantite * l.prix).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan="3" className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-xs">Total:</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 text-base">{reservation.total?.toFixed(2)} DT</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {reservation && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-wrap">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors text-sm"
            >
              Fermer
            </button>

            {isWriteAllowed && reservation.status === "EN_ATTENTE" && (
              <>
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={actionLoading === "cancel"}
                  className="px-4 py-2 rounded-lg font-medium text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={() => handleAction("validate")}
                  disabled={actionLoading === "validate"}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === "validate" ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Valider
                </button>
              </>
            )}

            {isWriteAllowed && reservation.status === "VALIDEE" && (
              <>
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={actionLoading === "cancel"}
                  className="px-4 py-2 rounded-lg font-medium text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={() => handleAction("consume")}
                  disabled={actionLoading === "consume"}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === "consume" ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                  Consommer le stock
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function TimelineStep({ label, detail, done, current, error }) {
  return (
    <div className="flex gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white ${
        error ? 'bg-rose-100 text-rose-600' :
        done ? 'bg-blue-100 text-blue-600' :
        current ? 'bg-amber-100 text-amber-600' :
        'bg-slate-100 text-slate-400'
      }`}>
        {error ? <XCircle className="w-5 h-5" /> :
         done ? <CheckCircle2 className="w-5 h-5" /> :
         current ? <Clock className="w-5 h-5" /> :
         <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
      </div>
      <div>
        <h4 className={`font-semibold ${done || current || error ? 'text-slate-800' : 'text-slate-400'}`}>{label}</h4>
        {detail && <p className="text-sm text-slate-500">{detail}</p>}
      </div>
    </div>
  );
}
