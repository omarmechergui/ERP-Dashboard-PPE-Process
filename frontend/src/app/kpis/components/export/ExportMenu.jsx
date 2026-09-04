import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileIcon, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

// Helper to format values
const formatExportValue = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val instanceof Date) return val.toLocaleDateString();
    return JSON.stringify(val);
  }
  return String(val);
};

// Helper to normalize data into array of objects and/or separate sheets
const normalizeExportData = (data) => {
  if (Array.isArray(data)) {
    return { Main: data };
  }
  
  if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        result[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = [value];
      } else {
        if (!result['Summary']) result['Summary'] = [];
        result['Summary'].push({ Metric: key, Value: value });
      }
    }
    return Object.keys(result).length > 0 ? result : { Main: [{ Data: "No structured data available" }] };
  }
  
  return { Main: [{ Value: data }] };
};

const exportToCSV = (data, filename) => {
  const normalized = normalizeExportData(data);
  // Pick the largest array or first one
  let bestKey = Object.keys(normalized)[0];
  let maxLen = 0;
  for (const key of Object.keys(normalized)) {
    if (normalized[key].length > maxLen) {
      maxLen = normalized[key].length;
      bestKey = key;
    }
  }
  
  const dataset = normalized[bestKey] || [];
  if (dataset.length === 0) return;
  
  const headers = Object.keys(dataset[0]);
  const csvRows = [];
  
  // Headers
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
  
  // Rows
  dataset.forEach(row => {
    const values = headers.map(h => {
      const val = formatExportValue(row[h]);
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for UTF-8
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const cleanForExcel = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
  if (val instanceof Date) return val.toLocaleDateString();
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.every(item => typeof item !== 'object')) {
        return val.join(', ');
      }
      return '[Voir Détails]';
    }
    return JSON.stringify(val);
  }
  return val;
};

const mapHeadersToFrench = (key) => {
  const map = {
    createdAt: 'Date de création',
    updatedAt: 'Dernière modification',
    status: 'Statut',
    progress: 'Avancement',
    quantity: 'Quantité',
    reference: 'Référence',
    id: 'ID',
    name: 'Nom',
    title: 'Titre',
    description: 'Description'
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
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

const exportToExcel = (data, filename, moduleName) => {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toLocaleDateString();
  const timeStr = new Date().toLocaleTimeString();
  
  const normalized = normalizeExportData(data);
  const mainData = normalized['Main'] || [];
  
  // Extract Stats & Details
  let statsData = {};
  let detailsData = {};
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (['stats', 'totals', 'statusDistribution', 'progress', 'timeline'].includes(key) && !Array.isArray(value)) {
         statsData[key] = value;
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
         detailsData[key] = value;
      }
    }
  }

  // --- 1. RÉSUMÉ SHEET ---
  const wsResumeData = [
    [{ v: 'RAPPORT D\'EXPORT', s: { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A8A' } }, alignment: { horizontal: 'center' } } }, null, null, null],
    [],
    [{ v: 'Module:', s: { font: { bold: true } } }, moduleName || 'Général'],
    [{ v: 'Date d\'export:', s: { font: { bold: true } } }, dateStr],
    [{ v: 'Heure:', s: { font: { bold: true } } }, timeStr],
    []
  ];

  if (Object.keys(statsData).length > 0) {
    wsResumeData.push([{ v: 'Indicateurs Clés', s: { font: { bold: true, sz: 14 } } }]);
    for (const [key, value] of Object.entries(statsData)) {
      if (typeof value === 'object' && value !== null) {
        for (const [subKey, subVal] of Object.entries(value)) {
           wsResumeData.push([{ v: subKey, s: { font: { bold: true } } }, subVal]);
        }
      } else {
        wsResumeData.push([{ v: key, s: { font: { bold: true } } }, value]);
      }
    }
  } else {
    wsResumeData.push([{ v: 'Indicateurs Clés', s: { font: { bold: true, sz: 14 } } }]);
    wsResumeData.push([{ v: 'Total des enregistrements', s: { font: { bold: true } } }, mainData.length]);
  }

  const wsResume = XLSX.utils.aoa_to_sheet(wsResumeData);
  // Merges for title
  wsResume['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  wsResume['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

  // Helper for generating styled data tables
  const generateStyledDataSheet = (dataset, sheetName) => {
    if (!dataset || dataset.length === 0) return;
    
    // Map headers and clean data
    const rawHeaders = Object.keys(dataset[0]);
    const headers = rawHeaders.map(mapHeadersToFrench);
    
    const formattedDataset = dataset.map(row => {
      const newRow = {};
      rawHeaders.forEach((k, idx) => {
        newRow[headers[idx]] = cleanForExcel(row[k]);
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(formattedDataset);
    
    // Auto-fit columns
    ws['!cols'] = autoFitColumns(formattedDataset, headers);
    
    // Apply styling to headers
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "334155" } }, // Slate 700
        alignment: { vertical: "center", horizontal: "center", wrapText: true },
        border: {
          top: { style: 'thin', color: { auto: 1 } },
          bottom: { style: 'thin', color: { auto: 1 } },
          left: { style: 'thin', color: { auto: 1 } },
          right: { style: 'thin', color: { auto: 1 } }
        }
      };
    }
    
    // Freeze first row and add autofilter
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
    ws['!autofilter'] = { ref: ws['!ref'] };
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  };

  // --- 2. DONNÉES SHEET ---
  if (mainData.length > 0 && !(mainData.length === 1 && mainData[0].Data === "No structured data available")) {
    generateStyledDataSheet(mainData, 'Données');
  }
  
  // --- 3. DÉTAILS SHEETS ---
  for (const [key, dataset] of Object.entries(detailsData)) {
    const sheetName = key.charAt(0).toUpperCase() + key.slice(1).substring(0, 30);
    generateStyledDataSheet(dataset, sheetName);
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

const exportToPDF = (data, filename, moduleName) => {
  const normalized = normalizeExportData(data);
  const doc = new jsPDF('landscape'); // Landscape for wide tables
  
  const dateStr = new Date().toLocaleDateString();
  const title = `Rapport - ${moduleName || 'Application'}`;
  
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Date d'export : ${dateStr}`, 14, 30);
  
  let currentY = 40;
  
  for (const [sectionName, dataset] of Object.entries(normalized)) {
    if (dataset.length === 0) continue;
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(sectionName, 14, currentY);
    currentY += 5;
    
    const headers = Object.keys(dataset[0]);
    const body = dataset.map(row => headers.map(h => formatExportValue(row[h])));
    
    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { top: 10, left: 14, right: 14 },
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    if (currentY > doc.internal.pageSize.getHeight() - 20) {
       doc.addPage();
       currentY = 20;
    }
  }
  
  doc.save(`${filename}.pdf`);
};

export default function ExportMenu({ data, userRole, moduleName = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  
  // Only ADMIN, SUPERVISOR, and GL can export
  if (!['ADMIN', 'SUPERVISOR', 'GL'].includes(userRole)) {
    return null;
  }

  const handleExport = async (type) => {
    if (loadingType) return;
    
    setLoadingType(type);
    
    try {
      // Allow UI to update to loading state before heavy JS operations
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      const dateStr = new Date().toISOString().split('T')[0];
      const prefix = moduleName ? `${moduleName.toLowerCase()}_` : '';
      const filename = `${prefix}export_${dateStr}`;
      
      if (type === 'pdf') {
        exportToPDF(data, filename, moduleName);
      } else if (type === 'excel') {
        exportToExcel(data, filename, moduleName);
      } else if (type === 'csv') {
        exportToCSV(data, filename);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error(`Error exporting as ${type}:`, error);
      // Silently fail or use existing global notification system if available
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => !loadingType && setIsOpen(!isOpen)}
        disabled={!!loadingType}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loadingType ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : <Download className="w-4 h-4 text-slate-500" />}
        Exporter
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
              className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-40 overflow-hidden"
            >
              <div className="py-2">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!!loadingType}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:bg-slate-50"
                >
                  {loadingType === 'pdf' ? <Loader2 className="w-4 h-4 text-rose-500 animate-spin" /> : <FileText className="w-4 h-4 text-rose-500" />}
                  {loadingType === 'pdf' ? 'Génération...' : 'Rapport PDF'}
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={!!loadingType}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:bg-slate-50"
                >
                  {loadingType === 'excel' ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
                  {loadingType === 'excel' ? 'Génération...' : 'Export Excel'}
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={!!loadingType}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:bg-slate-50"
                >
                  {loadingType === 'csv' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <FileIcon className="w-4 h-4 text-blue-500" />}
                  {loadingType === 'csv' ? 'Génération...' : 'Données CSV'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
