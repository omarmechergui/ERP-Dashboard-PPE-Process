// Perform common stock calculations

export const calculateInventoryValue = (articles) => {
  if (!articles || !articles.length) return 0;
  return articles.reduce((sum, art) => sum + ((art.quantite || 0) * (art.prix || 0)), 0);
};

export const calculateReservedValue = (articles) => {
  if (!articles || !articles.length) return 0;
  return articles.reduce((sum, art) => sum + ((art.quantite_reservee || 0) * (art.prix || 0)), 0);
};

export const calculateTotalStockValue = (articles) => {
  if (!articles || !articles.length) return 0;
  return articles.reduce((sum, art) => {
    const totalQty = (art.quantite || 0) + (art.quantite_reservee || 0);
    return sum + (totalQty * (art.prix || 0));
  }, 0);
};

export const calculateAverageCost = (articles) => {
  if (!articles || !articles.length) return 0;
  const totalCost = articles.reduce((sum, art) => sum + (art.prix || 0), 0);
  return totalCost / articles.length;
};


