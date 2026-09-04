import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, user, isSubmitting }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            Désactiver cet utilisateur ?
          </h3>
          
          <p className="text-gray-500 text-sm text-center mb-6">
            Êtes-vous sûr de vouloir désactiver le compte de <span className="font-bold text-gray-800">{user.nom}</span> ({user.matricule}) ? Cet utilisateur ne pourra plus se connecter.
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(user.id)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Désactiver"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
