export const getMovementTypeDetails = (type) => {
  switch (type) {
    case "ENTREE":
      return { label: "Entrée (Réception)", variant: "success", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    case "SORTIE":
      return { label: "Sortie (Production)", variant: "danger", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
    case "TRANSFERT":
      return { label: "Transfert", variant: "info", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    case "AJUSTEMENT":
      return { label: "Ajustement", variant: "warning", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
    case "RESERVATION":
      return { label: "Réservation", variant: "warning", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    default:
      return { label: type || "Inconnu", variant: "default", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
  }
};

export const formatMovementDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

