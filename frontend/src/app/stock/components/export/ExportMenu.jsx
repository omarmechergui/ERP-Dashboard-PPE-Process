import React, { useState } from 'react';
import { Download, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx-js-style';
import API from '../../../../lib/api';

const cleanForExcel = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
  if (val instanceof Date) return val.toLocaleDateString();
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
};

const autoFitColumns = (dataset, headers) => {
  const minWidth = 10;
  const maxWidth = 40;
  
  return headers.map(header => {
    let maxLen = header.toString().length;
    dataset.forEach(row => {
      const val = row[header];
      if (val !== null && val !== undefined) {
        const len = val.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 2, minWidth), maxWidth) };
  });
};

const getStockStatus = (article) => {
  const totalQty = article.quantite + (article.quantite_reservee || 0);
  if (totalQty <= 0) return "En rupture";
  if (totalQty <= article.min_stock) return "Stock Faible";
  if (totalQty > article.min_stock * 2) return "Sur-stock";
  return "Normal";
};

const formatCurrency = (val) => {
  return typeof val === 'number' ? val.toFixed(3) + ' TND' : val;
};

const generateStyledDataSheet = (wb, dataset, sheetName) => {
  if (!dataset || dataset.length === 0) return;
  
  const headers = Object.keys(dataset[0]);
  
  const formattedDataset = dataset.map(row => {
    const newRow = {};
    headers.forEach(h => {
      newRow[h] = cleanForExcel(row[h]);
    });
    return newRow;
  });

  const ws = XLSX.utils.json_to_sheet(formattedDataset);
  ws['!cols'] = autoFitColumns(formattedDataset, headers);
  
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "334155" } },
      alignment: { vertical: "center", horizontal: "center", wrapText: true },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    };
  }
  
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
  ws['!autofilter'] = { ref: ws['!ref'] };
  
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
};

export default function ExportMenu({ userRole, moduleName = 'Stock', filters = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  if (!['ADMIN', 'SUPERVISOR', 'GL'].includes(userRole)) {
    return null;
  }

  const handleExport = async (type) => {
    if (loadingType) return;
    
    setLoadingType(type);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsOpen(false);
    
    try {
      let queryParams = {};
      
      if (type === 'excel-filtered') {
        const { search, fournisseur_id, availability } = filters;
        if (search) queryParams.search = search;
        if (fournisseur_id && fournisseur_id !== 'all') queryParams.fournisseur_id = fournisseur_id;
        if (availability === 'low_stock') queryParams.low_stock = 'true';
      }

      const res = await API.get('/stock/export', { params: queryParams });
      const { articles, movements, reservations } = res.data;

      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${moduleName.toLowerCase()}_export_${dateStr}.xlsx`;

      // 1. Process Articles (Sheet 1)
      const stockData = articles.map(art => {
        const availableQty = art.quantite; 
        const totalQty = availableQty + (art.quantite_reservee || 0);
        const status = getStockStatus(art);
        const value = availableQty * (art.prix || 0);

        return {
          "Code Article": art.id,
          "Désignation": art.nom_article,
          "Fournisseur": art.fournisseur?.nom || '-',
          "Emplacement": art.address,
          "Quantité Totale": totalQty,
          "Quantité Réservée": art.quantite_reservee || 0,
          "Quantité Disponible": availableQty,
          "Stock Minimum": art.min_stock,
          "Prix Unitaire": art.prix,
          "Valeur du Stock": value,
          "Statut": status,
          "Créé le": new Date(art.createdAt).toLocaleDateString(),
          "Mis à jour le": new Date(art.updatedAt).toLocaleDateString(),
        };
      });

      // 2. Summary Sheet
      let totalValue = 0;
      let totalItems = 0;
      let outOfStock = 0;
      let lowStock = 0;
      let normalStock = 0;
      let highStock = 0;
      
      stockData.forEach(item => {
        totalItems++;
        totalValue += item["Valeur du Stock"];
        if (item["Statut"] === "En rupture") outOfStock++;
        else if (item["Statut"] === "Stock Faible") lowStock++;
        else if (item["Statut"] === "Normal") normalStock++;
        else if (item["Statut"] === "Sur-stock") highStock++;
      });

      const summaryData = [
        [{ v: "RÉSUMÉ DU STOCK", s: { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A8A' } } } }, null],
        [],
        [{ v: 'Total Articles', s: { font: { bold: true } } }, totalItems],
        [{ v: 'Valeur Globale du Stock', s: { font: { bold: true } } }, formatCurrency(totalValue)],
        [],
        [{ v: "DISTRIBUTION DES STATUTS", s: { font: { bold: true, sz: 14 } } }, null],
        [{ v: 'Normal', s: { font: { bold: true } } }, normalStock],
        [{ v: 'Stock Faible', s: { font: { bold: true } } }, lowStock],
        [{ v: 'En rupture', s: { font: { bold: true } } }, outOfStock],
        [{ v: 'Sur-stock', s: { font: { bold: true } } }, highStock],
      ];
      
      const wsResume = XLSX.utils.aoa_to_sheet(summaryData);
      wsResume['!cols'] = [{ wch: 30 }, { wch: 20 }];
      wsResume['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } }
      ];
      XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

      // Add other sheets
      if (stockData.length > 0) generateStyledDataSheet(wb, stockData, 'Stock');

      if (movements && movements.length > 0) {
        const mvData = movements.map(m => ({
          "Date": new Date(m.createdAt).toLocaleString(),
          "Type": m.type,
          "Article": m.article?.nom_article || '-',
          "Code Article": m.article_id,
          "Quantité": m.quantite,
          "Emplacement": m.emplacement,
          "Opérateur (Matricule)": m.matricule || '-',
          "Référence PO": m.po_reference || '-',
          "Planification": m.planification?.title || '-',
        }));
        generateStyledDataSheet(wb, mvData, 'Mouvements');
      }

      if (reservations && reservations.length > 0) {
        const resData = reservations.map(r => ({
          "Date": new Date(r.reservation?.createdAt).toLocaleString(),
          "Référence CMD": r.reservation?.reference || '-',
          "Client": r.reservation?.client || '-',
          "Statut": r.reservation?.status || '-',
          "Article": r.article?.nom_article || '-',
          "Code Article": r.article_id,
          "Quantité": r.quantite,
          "Prix": r.prix,
        }));
        generateStyledDataSheet(wb, resData, 'Réservations');
      }

      XLSX.writeFile(wb, filename);
      setSuccessMsg("Stock exported successfully");
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setErrorMsg("Failed to export stock data.");
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {errorMsg && <span className="text-sm text-rose-500 font-medium">{errorMsg}</span>}
      {successMsg && <span className="text-sm text-emerald-500 font-medium">{successMsg}</span>}
      
      <button
        onClick={() => !loadingType && setIsOpen(!isOpen)}
        disabled={!!loadingType}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loadingType ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : <Download className="w-4 h-4 text-slate-500" />}
        {loadingType ? 'Exporting Stock...' : 'Export Excel'}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-40 overflow-hidden"
            >
              <div className="py-2">
                <button
                  onClick={() => handleExport('excel-all')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Export All
                </button>
                <button
                  onClick={() => handleExport('excel-filtered')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 opacity-70" />
                  Export Filtered
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
