/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { X, Box, User, ShieldCheck, Layers, RefreshCw, Warehouse, Calendar, CheckCircle2, Clock } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function DetailPanneauModal({ isOpen, onClose, panneauId, getPanneauDetails, onEdit, isWriteAllowed }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && panneauId) {
      setLoading(true);
      setError("");
      getPanneauDetails(panneauId)
        .then((data) => setDetails(data))
        .catch((err) => {
          console.error(err);
          setError("Impossible de charger les détails du panneau.");
        })
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
    }
  }, [isOpen, panneauId, getPanneauDetails]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Détails du Panneau <span className="text-blue-600">{panneauId}</span>
              </h2>
              <p className="text-xs text-slate-500">{details?.title_panneau || 'Panneau MES'}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Chargement des détails...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          ) : details ? (
            <>
              {/* General Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projet</span>
                  <p className="text-sm font-bold text-slate-800 truncate">{details.title_project || "N/A"}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Superviseur</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{details.superviseur?.nom || details.superviseur?.matricule || "Non assigné"}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entrepôt Cible</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm truncate">
                    <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{details.entrepot?.nom || "Non défini"}</span>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" /> Statuts & Étapes
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                    <span className="font-semibold text-slate-500">Construction:</span>
                    <span className="font-bold text-blue-700">{details.etat_construction}</span>
                  </div>
                  <StatusBadge label="Validation" status={details.etat_validation} type="validation" />
                  <StatusBadge label="KHM" status={details.etat_khm} type="khm" />
                </div>
              </div>

              {/* BOM Details */}
              {details.bom && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Box className="w-4 h-4 text-purple-500" /> Nomenclature (BOM): {details.bom.nom_bom}
                    </h3>
                  </div>

                  {details.bom.lignes && details.bom.lignes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2">Article</th>
                            <th className="px-3 py-2 text-center">Quantité Requise</th>
                            <th className="px-3 py-2 text-right">Prix Unitaire</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {details.bom.lignes.map((ligne, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 font-medium text-slate-800">
                                {ligne.article?.nom_article || `Article #${ligne.article_id}`}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-slate-700">
                                {ligne.quantite}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-500">
                                {ligne.article?.prix ? `${ligne.article.prix} DT` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Aucun composant listé dans cette BOM.</p>
                  )}
                </div>
              )}

              {/* KHM Control Records */}
              {details.khmControls && details.khmControls.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Contrôles KHM
                  </h3>
                  <div className="space-y-2">
                    {details.khmControls.map((ctrl) => (
                      <div key={ctrl.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            ctrl.etat === 'CONFORME' ? 'bg-emerald-100 text-emerald-700' :
                            ctrl.etat === 'NON_CONFORME' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {ctrl.etat}
                          </span>
                          <span className="text-slate-400 text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(ctrl.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        {ctrl.commentaire && (
                          <p className="text-slate-600 italic">« {ctrl.commentaire} »</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none"
          >
            Fermer
          </button>

          {isWriteAllowed && details && (
            <button
              onClick={() => {
                onClose();
                onEdit(details);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Modifier ce panneau
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
