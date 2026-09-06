import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, ArrowUpDown, Plus, Search, Upload, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx-js-style';
import StockBadge from './StockBadge';
const SortHeader = ({ label, sortKey, onSort }) => (
  <th 
    className="p-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center gap-1">
      {label}
      <ArrowUpDown className="h-3 w-3 text-slate-400" />
    </div>
  </th>
);

export default function BomTable({ selectedBom, articlesMap, isWriteAllowed, onAddLine, onEditLine, onDeleteLine, onOpenImportModal }) {


  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'article_id', direction: 'asc' });

  // Map and calculate table data
  const tableData = useMemo(() => {
    if (!selectedBom?.lignes) return [];
    
    return selectedBom.lignes.map(l => {
      const art = articlesMap.get(l.article_id);
      const currentStock = art?.quantite || 0;
      const reservedStock = art?.quantite_reservee || 0;
      const availableStock = currentStock - reservedStock;
      const minStock = art?.min_stock || 0;
      const requiredQty = l.quantite;
      
      let status = 'Enough';
      if (availableStock < requiredQty || currentStock <= 0) {
        status = 'Out of Stock';
      } else if (currentStock < minStock) {
        status = 'Low Stock';
      }

      return {
        ...l,
        nom_article: art?.nom_article || l.article?.nom_article || '',
        currentStock,
        reservedStock,
        availableStock,
        minStock,
        unitPrice: l.prix || art?.prix || 0,
        totalPrice: (l.prix || art?.prix || 0) * requiredQty,
        status: articlesMap.has(l.article_id) ? status : 'Loading...'
      };
    });
  }, [selectedBom, articlesMap]);

  // Filter & Sort
  const filteredAndSortedData = useMemo(() => {
    let result = [...tableData];
    
    // Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.article_id.toLowerCase().includes(lower) || 
        r.nom_article.toLowerCase().includes(lower)
      );
    }
    
    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [tableData, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportBom = async () => {
    if (isExporting || !selectedBom) return;
    setIsExporting(true);

    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().split('T')[0];
      const bomRef = selectedBom.nom_bom || 'BOM';
      const filename = `BOM_${bomRef}_${dateStr}.xlsx`;

      // --- Sheet 1: Résumé BOM ---
      const totalCost = tableData.reduce((sum, r) => sum + r.totalPrice, 0);
      const summaryData = [
        [{ v: `BOM: ${selectedBom.nom_bom}`, s: { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '334155' } } } }, null, null],
        [],
        [{ v: 'Projet', s: { font: { bold: true } } }, selectedBom.nom_projet || '-'],
        [{ v: 'Référence BOM', s: { font: { bold: true } } }, selectedBom.nom_bom || '-'],
        [{ v: 'Jig (Planche)', s: { font: { bold: true } } }, selectedBom.jig || '-'],
        [{ v: 'Contrepartie', s: { font: { bold: true } } }, selectedBom.contrepartie || '-'],
        [{ v: 'Clip', s: { font: { bold: true } } }, selectedBom.clip || '-'],
        [],
        [{ v: 'RÉSUMÉ', s: { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '334155' } } } }, null],
        [{ v: 'Total Composants', s: { font: { bold: true } } }, tableData.length],
        [{ v: 'Coût Total Estimé', s: { font: { bold: true } } }, `${totalCost.toFixed(2)} TND`],
        [{ v: 'Date d\'export', s: { font: { bold: true } } }, new Date().toLocaleDateString('fr-FR')],
      ];

      const wsResume = XLSX.utils.aoa_to_sheet(summaryData);
      wsResume['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
      wsResume['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } }
      ];
      XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

      // --- Sheet 2: Composants ---
      if (tableData.length > 0) {
        const componentsData = tableData.map(row => ({
          "Code Article": row.article_id || '',
          "Désignation": row.nom_article || '',
          "Qté Requise": row.quantite,
          "Stock Actuel": row.currentStock,
          "Stock Réservé": row.reservedStock,
          "Stock Disponible": row.availableStock,
          "Stock Minimum": row.minStock,
          "Prix Unitaire (TND)": row.unitPrice,
          "Prix Total (TND)": row.totalPrice,
          "Statut Stock": row.status === 'Loading...' ? '-' : row.status
        }));

        const headers = Object.keys(componentsData[0]);
        const ws = XLSX.utils.json_to_sheet(componentsData);

        // Auto-fit columns
        ws['!cols'] = headers.map(header => {
          let maxLen = header.length;
          componentsData.forEach(row => {
            const val = row[header];
            if (val !== null && val !== undefined) {
              const len = val.toString().length;
              if (len > maxLen) maxLen = len;
            }
          });
          return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });

        // Style header row
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

        // Freeze header row
        ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
        ws['!autofilter'] = { ref: ws['!ref'] };

        XLSX.utils.book_append_sheet(wb, ws, 'Composants');
      }

      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error("BOM Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center bg-slate-50/50 p-4 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Composants ({filteredAndSortedData.length})
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher composant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleExportBom}
              disabled={isExporting || !selectedBom?.lignes?.length}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? 'Export...' : 'Exporter'}
            </button>
          
            {isWriteAllowed && (
              <>
                <button
                  onClick={onOpenImportModal}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-medium shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  Importer
                </button>
                <button
                  onClick={onAddLine}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-medium shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter Composant
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
          <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200">
            <tr>
              <SortHeader label="Code Article" sortKey="article_id" onSort={handleSort} />
              <SortHeader label="Désignation" sortKey="nom_article" onSort={handleSort} />
              <SortHeader label="Qté Requise" sortKey="quantite" onSort={handleSort} />
              <SortHeader label="Stock Actuel" sortKey="currentStock" onSort={handleSort} />
              <SortHeader label="Stock Réservé" sortKey="reservedStock" onSort={handleSort} />
              <SortHeader label="Stock Dispo" sortKey="availableStock" onSort={handleSort} />
              <SortHeader label="Stock Min" sortKey="minStock" onSort={handleSort} />
              <SortHeader label="Prix Unit." sortKey="unitPrice" onSort={handleSort} />
              <SortHeader label="Prix Total" sortKey="totalPrice" onSort={handleSort} />
              <SortHeader label="Statut Stock" sortKey="status" onSort={handleSort} />
              {isWriteAllowed && <th className="p-3 w-16"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedData.length > 0 ? (
              filteredAndSortedData.map((row) => (
                <tr
                  key={row.id} 
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="p-3 font-semibold text-slate-800">{row.article_id}</td>
                  <td className="p-3 text-slate-600">{row.nom_article}</td>
                  <td className="p-3 font-bold text-slate-800 bg-blue-50/30">
                    {row.quantite} {row.article_id === 'A002' || row.article_id === 'A004' ? 'm' : 'pcs'}
                  </td>
                  <td className="p-3 text-slate-600">{row.currentStock}</td>
                  <td className="p-3 text-amber-600/80 font-medium">{row.reservedStock}</td>
                  <td className="p-3 font-bold text-slate-700">{row.availableStock}</td>
                  <td className="p-3 text-slate-500">{row.minStock}</td>
                  <td className="p-3 text-slate-500">{row.unitPrice.toFixed(2)} TND</td>
                  <td className="p-3 font-semibold text-slate-800">{row.totalPrice.toFixed(2)} TND</td>
                  <td className="p-3">
                    {row.status === 'Loading...' ? (
                      <span className="text-slate-400 text-xs font-medium">Chargement...</span>
                    ) : (
                      <StockBadge status={row.status} />
                    )}
                  </td>
                  {isWriteAllowed && (
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditLine(row)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteLine(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isWriteAllowed ? 11 : 10} className="p-10 text-center text-slate-500">
                  Aucun composant trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
