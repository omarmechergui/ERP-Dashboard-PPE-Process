import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, Clock, ShieldCheck, MapPin, User, FileText, Hash } from "lucide-react";
import { getMovementTypeDetails, formatMovementDate } from "../utils/movementHelpers";

export const MovementDrawer = ({ movement, isOpen, onClose }) => {


  if (!isOpen || !movement) return null;

  const typeDetails = getMovementTypeDetails(movement.type);
  const isEntry = movement.type === "ENTREE";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto flex flex-col border-l border-slate-200"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${typeDetails.bg} ${typeDetails.color} ${typeDetails.border}`}>
                  {typeDetails.label}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {movement.id || 'N/A'}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{movement.article_id}</h2>
              <p className="text-sm text-slate-500 line-clamp-1">{movement.article?.nom_article}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Primary Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Quantity</p>
                <p className={`text-2xl font-bold ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isEntry ? "+" : "-"}{movement.quantite}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Date & Time</p>
                <p className="text-base font-bold text-slate-900">{formatMovementDate(movement.createdAt)}</p>
              </div>
            </div>

            {/* Details Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                Transaction Details
              </h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="flex px-4 py-3">
                  <div className="w-1/3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <MapPin className="h-4 w-4" /> Location
                  </div>
                  <div className="w-2/3 text-sm text-slate-900 font-mono">{movement.emplacement || "N/A"}</div>
                </div>
                {movement.po_reference && (
                  <div className="flex px-4 py-3">
                    <div className="w-1/3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <FileText className="h-4 w-4" /> Reference
                    </div>
                    <div className="w-2/3 text-sm text-slate-900 font-mono">{movement.po_reference}</div>
                  </div>
                )}
                {movement.matricule && (
                  <div className="flex px-4 py-3">
                    <div className="w-1/3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <User className="h-4 w-4" /> Operator
                    </div>
                    <div className="w-2/3 text-sm text-slate-900 font-mono">{movement.matricule}</div>
                  </div>
                )}
                {movement.planification?.title && (
                  <div className="flex px-4 py-3">
                    <div className="w-1/3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Hash className="h-4 w-4" /> Planning
                    </div>
                    <div className="w-2/3 text-sm text-slate-900">{movement.planification.title}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
