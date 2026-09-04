// Format currency (TND)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "0.00 TND";
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' TND';
};

// Format quantity with unit
export const formatQuantity = (quantity, id) => {
  if (quantity === undefined || quantity === null) return "0";
  const unit = (id === "A002" || id === "A004") ? "m" : "pcs";
  return `${quantity} ${unit}`;
};

// Format date
export const formatDate = (dateString) => {
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
