/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function BomImportModal({ isOpen, onClose, selectedBom, actions }) {
  const [step, setStep] = useState('select'); // 'select' | 'importing' | 'results'
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  
  const [report, setReport] = useState(null);

  const fileInputRef = useRef(null);

  const reset = () => {
    setStep('select');
    setFile(null);
    setError(null);
    setReport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls") && !selectedFile.name.endsWith(".csv")) {
        setError("Veuillez sélectionner un fichier Excel valide (.xlsx, .xls ou .csv).");
        return;
      }
      setFile(selectedFile);
      setError(null);
      handleImport(selectedFile);
    }
  };

  const handleImport = (fileToParse) => {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setStep('importing');
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

        const parsedLines = [];
        data.forEach((row) => {
          const getVal = (possibleNames) => {
            const key = Object.keys(row).find(k => 
              possibleNames.includes(k.toLowerCase().trim())
            );
            return key ? row[key] : undefined;
          };

          const rawCode = getVal(['article code', 'code article', 'article_id', 'article']);
          const rawQty = getVal(['quantity', 'quantité', 'qty', 'quantite']);

          const originalCode = String(rawCode || '').trim();
          const qty = parseFloat(rawQty);

          if (originalCode && !isNaN(qty)) {
            parsedLines.push({
              article_id: originalCode,
              quantite: qty
            });
          }
        });

        if (parsedLines.length === 0) {
          throw new Error("Aucune donnée valide trouvée. Vérifiez les colonnes 'Article Code' et 'Quantity'.");
        }

        // Call backend bulk import API
        const result = await actions.bulkImportLines(selectedBom.id, parsedLines);
        setReport({
          success: result.importedCount,
          total: parsedLines.length
        });
        setStep('results');
      } catch (err) {
        setError(err.message || "Erreur lors de l'importation.");
        setStep('select');
      }
    };
    reader.onerror = () => {
      setError("Erreur de lecture du fichier.");
      setStep('select');
    };
    reader.readAsBinaryString(fileToParse);
  };

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={step === 'importing' ? undefined : onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Import BOM Components</h2>
              <p className="text-sm text-slate-500 mt-1">Import multiple components using an Excel or CSV file.</p>
            </div>
            {step !== 'importing' && (
              <button
                onClick={() => { reset(); onClose(); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            
            {/* STEP 1: SELECT FILE */}
            {step === 'select' && (
              <div className="space-y-6">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
                  onClick={() => fileInputRef.current?.click()}
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
                      <FileSpreadsheet className="h-10 w-10 text-emerald-500 mb-2" />
                      <p className="font-semibold text-slate-700">{file.name}</p>
                      <p className="text-sm text-slate-500 mt-1">Cliquez pour changer de fichier</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-slate-400 mb-2" />
                      <p className="font-semibold text-slate-700">Choose Excel File</p>
                      <p className="text-sm text-slate-500 mt-1">Click here to browse files</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="bg-blue-50 text-blue-800 p-5 rounded-xl border border-blue-100 space-y-4">
                  <div>
                    <h4 className="font-bold mb-2">Required Excel Format</h4>
                    <div className="bg-white rounded border border-blue-200 overflow-hidden text-sm">
                      <table className="w-full text-left">
                        <thead className="bg-blue-50/50 border-b border-blue-200 text-blue-900">
                          <tr>
                            <th className="p-2 pl-4 font-semibold">Article Code</th>
                            <th className="p-2 pr-4 font-semibold text-right">Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50 text-blue-900/80 font-mono text-xs">
                          <tr>
                            <td className="p-2 pl-4">A0005451390</td>
                            <td className="p-2 pr-4 text-right">20</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 & 4: IMPORTING & RESULTS */}
            {(step === 'importing' || step === 'results') && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    {step === 'importing' ? (
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {step === 'importing' ? 'Importation en cours...' : 'Import Completed'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {step === 'importing' 
                        ? `Envoi des données au serveur...`
                        : `✓ ${report?.success || 0} / ${report?.total || 0} components imported successfully`
                      }
                    </p>
                  </div>
                </div>

                {step === 'results' && report?.success < report?.total && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-4">
                    <div className="flex items-start gap-3 text-amber-700">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">Certaines lignes ont été ignorées</h4>
                        <p className="text-sm opacity-90 mt-1">
                          Les lignes avec des articles inexistants, des quantités invalides, ou déjà présentes dans la nomenclature ont été ignorées par le serveur.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            {step === 'select' && (
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
            )}

            {step === 'results' && (
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors"
              >
                Fermer
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
