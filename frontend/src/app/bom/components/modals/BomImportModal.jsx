/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, FileSpreadsheet, Loader2, AlertCircle, 
  CheckCircle2, Download, AlertTriangle, ChevronRight,
  Search, CheckCircle, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import API from '@/lib/api';

const STEPS = [
  { id: 1, name: 'Upload' },
  { id: 2, name: 'Analyse' },
  { id: 3, name: 'Preview' },
  { id: 4, name: 'Import' },
  { id: 5, name: 'Result' }
];

export default function BomImportModal({ isOpen, onClose, selectedBom, actions }) {
  const [stepIndex, setStepIndex] = useState(1); 
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  
  // Analysis & Validation States
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  
  // Import States
  const [isImporting, setIsImporting] = useState(false);
  const [report, setReport] = useState(null);

  // Preview table filters
  const [filter, setFilter] = useState('all'); // all, valid, error, warning
  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef(null);

  const reset = () => {
    setStepIndex(1);
    setFile(null);
    setError(null);
    setIsParsing(false);
    setParsedData([]);
    setIsValidating(false);
    setPreviewRows([]);
    setIsImporting(false);
    setReport(null);
    setFilter('all');
    setSearchTerm('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen]);

  // Download template
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([{
      "Article Code": "A0005451390",
      "Quantity": 20
    }]);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, "Modèle Import BOM");
    XLSX.writeFile(wb, "bom_import_template.xlsx");
  };

  // Step 1: Upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls") && !selectedFile.name.endsWith(".csv")) {
        setError("Veuillez sélectionner un fichier Excel valide (.xlsx, .xls ou .csv).");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".xlsx") && !droppedFile.name.endsWith(".xls") && !droppedFile.name.endsWith(".csv")) {
        setError("Veuillez déposer un fichier Excel valide (.xlsx, .xls ou .csv).");
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  // Step 2: Analyze
  const analyzeFile = () => {
    setStepIndex(2);
    setIsParsing(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        if (wb.SheetNames.length === 0) {
          throw new Error("Le fichier Excel est vide.");
        }

        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          throw new Error("Aucune ligne de données trouvée dans le fichier.");
        }

        const extracted = [];
        data.forEach((row, index) => {
          const getVal = (possibleNames) => {
            const key = Object.keys(row).find(k => 
              possibleNames.includes(k.toLowerCase().trim())
            );
            return key ? row[key] : undefined;
          };

          const rawCode = getVal(['article code', 'code article', 'article_id', 'article']);
          const rawQty = getVal(['quantity', 'quantité', 'qty', 'quantite']);

          extracted.push({
            lineNumber: index + 2, // Accounting for header (1-indexed + header row)
            articleCode: String(rawCode || '').trim(),
            quantity: rawQty,
            rawRow: row
          });
        });

        // Check mandatory column mappings
        const hasCodes = extracted.some(r => r.articleCode);
        if (!hasCodes) {
          throw new Error("Colonne obligatoire 'Article Code' introuvable. Assurez-vous que l'en-tête de la colonne est correct.");
        }

        setParsedData(extracted);
      } catch (err) {
        setError(err.message || "Erreur lors de l'analyse du fichier.");
        setStepIndex(1); // Go back if fail
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError("Erreur de lecture du fichier.");
      setIsParsing(false);
      setStepIndex(1);
    };
    reader.readAsBinaryString(file);
  };

  // Step 3: Validate (Preview)
  const startValidation = async () => {
    setStepIndex(3);
    setIsValidating(true);
    setError(null);
    try {
      const uniqueCodes = [...new Set(parsedData.map(r => r.articleCode).filter(Boolean))];
      
      let dbArticles = [];
      if (uniqueCodes.length > 0) {
         const res = await API.post('/stock/articles/by-ids', { ids: uniqueCodes });
         dbArticles = res.data || [];
      }
      
      const dbArticleMap = new Map(dbArticles.map(a => [a.id, a]));
      const existingBomCodes = new Set((selectedBom?.lignes || []).map(l => l.article_id));
      
      const validatedRows = parsedData.map(row => {
        const qty = parseFloat(row.quantity);
        let status = 'valid';
        let message = '';
        let articleDesignation = '';
        
        if (!row.articleCode) {
          status = 'error';
          message = 'Code article manquant';
        } else if (isNaN(qty) || qty <= 0) {
          status = 'error';
          message = 'Quantité invalide';
        } else if (!dbArticleMap.has(row.articleCode)) {
          status = 'error';
          message = `Article ${row.articleCode} introuvable dans la base`;
        } else if (existingBomCodes.has(row.articleCode)) {
          status = 'warning';
          message = `Article déjà présent dans cette nomenclature`;
          articleDesignation = dbArticleMap.get(row.articleCode).designation;
        } else {
          articleDesignation = dbArticleMap.get(row.articleCode).designation;
        }

        return {
          ...row,
          parsedQuantity: qty,
          designation: articleDesignation,
          status,
          message
        };
      });

      setPreviewRows(validatedRows);
    } catch (err) {
      setError("Erreur lors de la validation des données: " + (err.response?.data?.error || err.message));
      setStepIndex(2); // Keep at analyse if failed
    } finally {
      setIsValidating(false);
    }
  };

  // Step 4: Import
  const handleImport = async () => {
    setStepIndex(4);
    setIsImporting(true);
    setError(null);
    try {
      const linesToImport = previewRows
        .filter(r => r.status === 'valid')
        .map(r => ({
          article_id: r.articleCode,
          quantite: r.parsedQuantity
        }));

      if (linesToImport.length === 0) {
        throw new Error("Aucune ligne valide à importer.");
      }

      await actions.bulkImportLines(selectedBom.id, linesToImport);
      
      setReport({
        success: linesToImport.length,
        total: previewRows.length,
        errors: previewRows.filter(r => r.status === 'error').length,
        warnings: previewRows.filter(r => r.status === 'warning').length
      });
      setStepIndex(5);
    } catch (err) {
      setError(err.message || "Erreur lors de l'importation.");
      setStepIndex(3); // Go back to preview to let user see
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered preview rows
  const filteredRows = useMemo(() => {
    return previewRows.filter(row => {
      const matchesSearch = row.articleCode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            row.designation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || row.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [previewRows, filter, searchTerm]);

  // Derived counts
  const validCount = previewRows.filter(r => r.status === 'valid').length;
  const errorCount = previewRows.filter(r => r.status === 'error').length;
  const warningCount = previewRows.filter(r => r.status === 'warning').length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={(stepIndex === 4 || stepIndex === 2) ? undefined : onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Importer des composants</h2>
              <div className="flex items-center gap-2 mt-2">
                {STEPS.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <span className={`text-sm font-medium ${stepIndex >= step.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {step.id}. {step.name}
                    </span>
                    {idx < STEPS.length - 1 && (
                      <ChevronRight className={`h-4 w-4 ${stepIndex > step.id ? 'text-emerald-500' : 'text-slate-300'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            {stepIndex !== 4 && (
              <button
                onClick={() => { reset(); onClose(); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
            
            {/* Global Error */}
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* STEP 1: SELECT FILE */}
            {stepIndex === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div 
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileSpreadsheet className="h-12 w-12 text-emerald-500 mb-3" />
                      <p className="font-semibold text-lg text-slate-700">{file.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB • Fichier sélectionné</p>
                      <p className="text-xs text-emerald-600 font-medium mt-4">Cliquez pour modifier ou continuez l'analyse</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-100 p-4 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="font-semibold text-lg text-slate-700">Importer un fichier BOM Excel</p>
                      <p className="text-sm text-slate-500 mt-2 max-w-sm">Glissez-déposez votre fichier ici ou cliquez pour sélectionner un fichier depuis votre ordinateur.</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 text-blue-800 p-5 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">Format Excel Requis</h4>
                    <p className="text-xs mt-1 text-blue-700/80">Colonnes obligatoires : "Article Code", "Quantity"</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 text-sm font-semibold bg-white border border-blue-200 px-4 py-2 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Modèle Excel
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ANALYSE */}
            {stepIndex === 2 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
                  {isParsing ? (
                    <>
                      <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                      <h3 className="text-lg font-bold text-slate-800">Analyse du fichier en cours...</h3>
                      <p className="text-sm text-slate-500 mt-2">Lecture des données et détection des colonnes.</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-emerald-100 p-3 rounded-full mb-4">
                        <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Fichier analysé avec succès</h3>
                      <p className="text-sm text-slate-500 mt-2">{parsedData.length} lignes de données détectées.</p>
                      
                      <div className="mt-8 w-full max-w-lg mx-auto">
                        <h4 className="text-left text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Mapping des colonnes</h4>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden text-sm text-left">
                          <table className="w-full">
                            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                              <tr>
                                <th className="p-3 font-semibold">Champ requis</th>
                                <th className="p-3 font-semibold text-right">Statut</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr>
                                <td className="p-3 font-medium">Article Code</td>
                                <td className="p-3 text-right">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Détecté
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 font-medium">Quantity</td>
                                <td className="p-3 text-right">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Détecté
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW */}
            {stepIndex === 3 && (
              <div className="h-full flex flex-col space-y-6">
                {isValidating ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm flex-1">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Validation des données en cours...</h3>
                    <p className="text-sm text-slate-500 mt-2">Vérification de l'existence des articles dans la base de données.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Lignes</p>
                          <p className="text-2xl font-bold text-slate-800">{previewRows.length}</p>
                        </div>
                        <div className="p-2.5 bg-slate-100 rounded-xl"><FileSpreadsheet className="h-5 w-5 text-slate-600" /></div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Valides</p>
                          <p className="text-2xl font-bold text-emerald-700">{validCount}</p>
                        </div>
                        <div className="p-2.5 bg-emerald-100 rounded-xl"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Warnings</p>
                          <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
                        </div>
                        <div className="p-2.5 bg-amber-100 rounded-xl"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Erreurs</p>
                          <p className="text-2xl font-bold text-rose-700">{errorCount}</p>
                        </div>
                        <div className="p-2.5 bg-rose-100 rounded-xl"><XCircle className="h-5 w-5 text-rose-600" /></div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            Toutes ({previewRows.length})
                          </button>
                          <button 
                            onClick={() => setFilter('valid')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'valid' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            Valides ({validCount})
                          </button>
                          <button 
                            onClick={() => setFilter('warning')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'warning' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            Warnings ({warningCount})
                          </button>
                          <button 
                            onClick={() => setFilter('error')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'error' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            Erreurs ({errorCount})
                          </button>
                        </div>
                        
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="overflow-auto max-h-[400px]">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 z-10 shadow-sm">
                            <tr>
                              <th className="p-3 font-semibold w-16 text-center">Ligne</th>
                              <th className="p-3 font-semibold">Article</th>
                              <th className="p-3 font-semibold">Désignation</th>
                              <th className="p-3 font-semibold text-right">Quantité</th>
                              <th className="p-3 font-semibold w-64">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredRows.length > 0 ? filteredRows.map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 text-slate-400 text-center">{row.lineNumber}</td>
                                <td className="p-3 font-mono text-slate-700 font-medium">{row.articleCode || '-'}</td>
                                <td className="p-3 text-slate-600 truncate max-w-[200px]" title={row.designation}>{row.designation || '-'}</td>
                                <td className="p-3 text-right font-medium text-slate-700">{row.parsedQuantity}</td>
                                <td className="p-3">
                                  {row.status === 'valid' && (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md font-semibold text-xs">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Valide
                                    </span>
                                  )}
                                  {row.status === 'warning' && (
                                    <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md font-semibold text-xs" title={row.message}>
                                      <AlertTriangle className="h-3.5 w-3.5" /> {row.message}
                                    </span>
                                  )}
                                  {row.status === 'error' && (
                                    <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md font-semibold text-xs" title={row.message}>
                                      <XCircle className="h-3.5 w-3.5" /> {row.message}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan="5" className="p-12 text-center text-slate-500">
                                  Aucun résultat correspondant aux filtres.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 4 & 5: IMPORTING & RESULTS */}
            {(stepIndex === 4 || stepIndex === 5) && (
              <div className="space-y-6 max-w-2xl mx-auto py-12">
                <div className="flex flex-col items-center text-center">
                  <div className={`p-5 rounded-full mb-6 ${stepIndex === 4 ? 'bg-blue-100' : (report?.errors === 0 && report?.warnings === 0) ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {stepIndex === 4 ? (
                      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                    ) : (
                      <CheckCircle2 className={`h-12 w-12 ${report?.errors === 0 && report?.warnings === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-2xl mb-2">
                    {stepIndex === 4 ? 'Importation en cours...' : 'Importation Terminée'}
                  </h3>
                  <p className="text-slate-500 text-lg">
                    {stepIndex === 4 
                      ? `Enregistrement de ${validCount} composants dans la base de données...`
                      : `Les données ont été traitées par le serveur.`
                    }
                  </p>
                </div>

                {stepIndex === 5 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-8">
                    <h4 className="font-bold text-slate-800 mb-6 text-center">Résumé de l'opération</h4>
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <p className="text-4xl font-bold text-emerald-600 mb-2">{report?.success}</p>
                        <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Importées</p>
                      </div>
                      <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-4xl font-bold text-amber-600 mb-2">{report?.warnings}</p>
                        <p className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Ignorées (Warnings)</p>
                      </div>
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-4xl font-bold text-slate-600 mb-2">{report?.errors}</p>
                        <p className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Erreurs Rejetées</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
            {/* Left side */}
            <div>
              {(stepIndex > 1 && stepIndex < 4) && (
                <button
                  onClick={() => {
                    if (stepIndex === 2) setStepIndex(1);
                    if (stepIndex === 3) {
                      setStepIndex(2);
                      setPreviewRows([]);
                    }
                  }}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Retour
                </button>
              )}
            </div>

            {/* Right side */}
            <div className="flex gap-3">
              {(stepIndex < 4) && (
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Annuler
                </button>
              )}

              {stepIndex === 1 && (
                <button
                  onClick={() => file && analyzeFile()}
                  disabled={!file}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  Analyser le fichier <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {stepIndex === 2 && !isParsing && (
                <button
                  onClick={startValidation}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  Valider l'Aperçu <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {stepIndex === 3 && !isValidating && (
                <button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {validCount > 0 ? `Importer ${validCount} lignes` : 'Importation impossible'}
                </button>
              )}

              {stepIndex === 5 && (
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="px-8 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors shadow-sm"
                >
                  Terminer
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
