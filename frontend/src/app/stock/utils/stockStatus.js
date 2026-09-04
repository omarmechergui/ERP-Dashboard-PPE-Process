// Determine the stock status based on quantities
export const getStockStatus = (article) => {
  const currentQuantity = article.quantite || 0;
  const minStock = article.min_stock || 0;
  
  // Example logic: if we don't have min_stock set, we can guess it's 10 or default to something, 
  // but let's use the provided min_stock or a fallback.
  const threshold = minStock > 0 ? minStock : 10;
  
  if (currentQuantity <= 0) {
    return { label: "Out of Stock", variant: "danger", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  }
  
  if (currentQuantity <= threshold / 2) {
    return { label: "Critical", variant: "critical", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
  }
  
  if (currentQuantity <= threshold) {
    return { label: "Low Stock", variant: "warning", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
  }

  // Incoming logic can be based on 'incoming_orders' if backend supports it. For now, it's just Available or Reserved.
  const reservedQuantity = article.quantite_reservee || 0;
  if (reservedQuantity > 0 && currentQuantity === reservedQuantity) {
    return { label: "Fully Reserved", variant: "reserved", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
  }

  return { label: "Available", variant: "success", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
};
