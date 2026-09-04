import React from 'react';
import { Send, CheckCircle, XCircle, Archive, RefreshCw, Edit, Copy } from 'lucide-react';

export function WorkflowActions({ 
  organigramme, 
  workflowConfig, 
  onRejectClick, 
  onEditClick,
  setAlert
}) {
  if (!organigramme || !workflowConfig) return null;

  const {
    canSubmit,
    canValidate,
    canReject,
    canArchive,
    canResubmit,
    canEdit,
    canClone,
    submit,
    validate,
    archive,
    resubmit,
    clone,
    actionInProgress
  } = workflowConfig;

  const runAction = async (actionFn, id, ...args) => {
    const res = await actionFn(id, ...args);
    if (res?.success) {
      if (setAlert) setAlert({ type: 'success', message: 'Action effectuée avec succès.' });
    } else if (res?.error) {
      if (setAlert) setAlert({ type: 'error', message: res.error });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit(organigramme) && (
        <button
          onClick={onEditClick}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </button>
      )}

      {canSubmit(organigramme) && (
        <button
          onClick={() => runAction(submit, organigramme.id, "Soumis pour validation")}
          disabled={actionInProgress}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Soumettre
        </button>
      )}

      {canValidate(organigramme) && (
        <button
          onClick={() => {
            if (window.confirm("Êtes-vous sûr de vouloir valider cet organigramme ? L'organigramme actuellement actif sera archivé.")) {
              runAction(validate, organigramme.id, "Validé");
            }
          }}
          disabled={actionInProgress}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          Valider
        </button>
      )}

      {canReject(organigramme) && (
        <button
          onClick={onRejectClick}
          disabled={actionInProgress}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Rejeter
        </button>
      )}

      {canResubmit(organigramme) && (
        <button
          onClick={() => runAction(resubmit, organigramme.id, "Soumis à nouveau pour validation")}
          disabled={actionInProgress}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Soumettre à nouveau
        </button>
      )}

      {canArchive(organigramme) && (
        <button
          onClick={() => {
            if (window.confirm("Archiver cet organigramme le retirera de la vue principale. Confirmer ?")) {
              runAction(archive, organigramme.id, "Archivé");
            }
          }}
          disabled={actionInProgress}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm disabled:opacity-50"
        >
          <Archive className="w-4 h-4" />
          Archiver
        </button>
      )}
      
      {canClone && canClone(organigramme) && (
        <button
          onClick={() => runAction(clone, organigramme.id)}
          disabled={actionInProgress}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Créer un brouillon (V{organigramme.version + 1})
        </button>
      )}
    </div>
  );
}
