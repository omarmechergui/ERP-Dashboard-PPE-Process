"use client";

import { useEffect, useState } from "react";
import { X, PackageCheck, Package, Clock, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import API from "@/lib/api";

export default function CommandeDetailsDrawer({ commandeId, onClose, onUpdate }) {
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await API.get(`/commandes/${commandeId}`);
        setCommande(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [commandeId]);

  const handleReceive = async () => {
    if (!confirm("Êtes-vous sûr de vouloir marquer cette commande comme reçue ?")) return;
    
    setReceiving(true);
    try {
      await API.put(`/commandes/${commandeId}/receive`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réception de la commande.");
    } finally {
      setReceiving(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 transform transition-transform flex flex-col animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-800">
                {commande ? (commande.reference || `CMD${String(commande.id).padStart(3, "0")}`) : "Détails"}
              </h2>
              {commande && <StatusBadge status={commande.status} />}
            </div>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              Fournisseur: {commande?.fournisseur?.nom || "..."}
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
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              Chargement des détails...
            </div>
          ) : !commande ? (
            <div className="text-center py-20 text-rose-500 flex flex-col items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              Erreur lors du chargement de la commande.
            </div>
          ) : (
            <>
              {/* Timeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Progression
                </h3>
                
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 ring-4 ring-white">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Commande créée</h4>
                        <p className="text-sm text-slate-500">
                          Le {new Date(commande.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white ${commande.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {commande.status === 'RECEIVED' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {commande.status === 'RECEIVED' ? 'Réceptionnée (Stock mis à jour)' : 'En attente de réception'}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {commande.status === 'RECEIVED' ? `Le ${new Date(commande.updatedAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'L\'expédition du fournisseur est attendue.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles Summary */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Articles commandés
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
                      {commande.lignes?.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {l.article?.nom || l.article?.nom_article || "N/A"}
                            <div className="text-xs text-slate-500 font-normal">ID: {l.article_id}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-600">{l.quantite}</td>
                          <td className="py-3 px-4 text-right text-slate-500">{l.prix?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-800">
                            {(l.quantite * l.prix).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan="3" className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-xs">Total de la commande:</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 text-base">{commande.total?.toFixed(2)} DT</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {commande && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors text-sm"
            >
              Fermer
            </button>
            {commande.status === "PENDING" && (
              <button
                onClick={handleReceive}
                disabled={receiving}
                className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {receiving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <PackageCheck className="w-4 h-4" />
                )}
                Marquer comme reçue
              </button>
            )}
          </div>
        )}
        
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        EN ATTENTE
      </span>
    );
  }
  if (status === "RECEIVED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5" />
        REÇUE
      </span>
    );
  }
  return null;
}
