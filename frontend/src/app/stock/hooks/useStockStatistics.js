import { useMemo } from "react";
import { calculateInventoryValue, calculateReservedValue, calculateAverageCost } from "../utils/stockCalculations";

export const useStockStatistics = (articles, backendStats) => {
  return useMemo(() => {
    if (backendStats) {
      return backendStats;
    }

    if (!articles || articles.length === 0) {
      return {
        totalArticles: 0,
        availableStock: 0,
        reservedStock: 0,
        totalValue: 0,
        reservedValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        averageUnitCost: 0,
      };
    }

    let availableStock = 0;
    let reservedStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    articles.forEach((art) => {
      availableStock += art.quantite || 0;
      reservedStock += art.quantite_reservee || 0;
      
      const minStock = art.min_stock || 10;
      if ((art.quantite || 0) <= 0) {
        outOfStockCount++;
      } else if ((art.quantite || 0) <= minStock) {
        lowStockCount++;
      }
    });

    return {
      totalArticles: articles.length,
      availableStock,
      reservedStock,
      totalValue: calculateInventoryValue(articles),
      reservedValue: calculateReservedValue(articles),
      lowStockCount,
      outOfStockCount,
      averageUnitCost: calculateAverageCost(articles),
    };
  }, [articles, backendStats]);
};
