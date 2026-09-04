import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download, Eye, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import API from "../../../lib/api";

const BATCH_SIZE = 25;

export const ImportWizard = ({ isOpen, onClose, onRefresh, user }) => {
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing, 4: Success
  const [previewData, setPreviewData] = useState(null);
  
  // Progress tracking
  const [importStats, setImportStats] = useState({
    total: 0,
    processed: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    currentBatch: 0,
    totalBatches: 0
  });
  
  const [stage, setStage] = useState(0); // 0: None, 1: Reading, 2: Validating, 3: Importing, 4: Finalizing
  const cancelledRef = useRef(false);
  const fileInputRef = useRef(null);

  const generateFileHash = async (fileData) => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        setImportStats(prev => ({ ...prev, errors: [...prev.errors, { error: "Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)." }] }));
        return;
      }
      setFile(selectedFile);
      setPreviewData(null);
      setImportStats({ total: 0, processed: 0, imported: 0, skipped: 0, errors: [], currentBatch: 0, totalBatches: 0 });
      setStep(1);
    }
  };

  const handleValidateAndPreview = async () => {
    if (!file) return;

    setLoading(true);
    setStage(1); // Reading
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const hash = await generateFileHash(data);
          setFileHash(hash);

          const workbook = XLSX.read(data, { type: "array" });
          if (workbook.SheetNames.length === 0) throw new Error("Le fichier Excel est vide.");

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet);

          if (rows.length === 0) throw new Error("Aucune ligne de données trouvée dans le fichier.");

          setStage(2); // Validating (server side preview)

          const response = await API.post("/stock/import", {
            rows,
            matricule: user?.matricule,
            fileHash: hash,
            fileName: file.name,
            isPreview: true
          });

          setPreviewData({ rows: rows, ...response.data });
          setStep(2);
        } catch (err) {
          setImportStats(prev => ({ ...prev, errors: [{ error: err.error || err.message || "Erreur de traitement" }] }));
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setImportStats(prev => ({ ...prev, errors: [{ error: "Erreur de lecture du fichier" }] }));
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setImportStats(prev => ({ ...prev, errors: [{ error: "Erreur inattendue" }] }));
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData || !previewData.canImport) return;

    setStep(3); // Start import UI
    setStage(3); // Importing
    cancelledRef.current = false;
    
    // Filter valid rows
    const validRows = previewData.previewRows.filter(r => r.Status === "Valid");
    const totalBatches = Math.ceil(validRows.length / BATCH_SIZE);
    
    setImportStats({
      total: validRows.length,
      processed: 0,
      imported: 0,
      skipped: previewData.failedCount || 0, // already skipped errors from preview
      errors: previewData.failedRows || [],
      currentBatch: 0,
      totalBatches
    });

    let currentImported = 0;
    let currentProcessed = 0;
    let currentSkipped = previewData.failedCount || 0;
    let currentErrors = [...(previewData.failedRows || [])];

    for (let i = 0; i < totalBatches; i++) {
      if (cancelledRef.current) break;

      const batchRows = validRows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      
      try {
        const response = await API.post("/stock/import/batch", {
          rows: batchRows,
          matricule: user?.matricule,
          fileHash: i === 0 ? fileHash : undefined, // Only send hash on first batch
          fileName: i === 0 ? file.name : undefined
        });

        currentImported += response.data.imported;
        currentSkipped += response.data.skipped;
        currentErrors = [...currentErrors, ...response.data.errors];
      } catch (err) {
        currentSkipped += batchRows.length;
        currentErrors.push({
          error: `Le batch ${i + 1} a échoué complètement: ${err.response?.data?.error || err.message || "Erreur réseau"}`
        });
      }

      currentProcessed += batchRows.length;
      
      setImportStats(prev => ({
        ...prev,
        processed: currentProcessed,
        imported: currentImported,
        skipped: currentSkipped,
        errors: currentErrors,
        currentBatch: i + 1
      }));
    }

    setStage(4); // Finalizing
    setTimeout(() => {
      setStep(4); // Success screen
      if (currentImported > 0) onRefresh();
    }, 500);
  };

  const cancelImport = () => {
    cancelledRef.current = true;
  };

  const downloadErrors = () => {
    if (importStats.errors.length === 0 && (!previewData || previewData.failedCount === 0)) return;
    
    const errorsToDownload = importStats.errors.length > 0 ? importStats.errors : previewData.failedRows;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(errorsToDownload);
    ws['!cols'] = Object.keys(errorsToDownload[0] || {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Erreurs");
    XLSX.writeFile(wb, "import_erreurs.xlsx");
  };

  const reset = () => {
    setFile(null);
    setFileHash(null);
    setPreviewData(null);
    setImportStats({ total: 0, processed: 0, imported: 0, skipped: 0, errors: [], currentBatch: 0, totalBatches: 0 });
    setStep(1);
    setStage(0);
    cancelledRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isOpen) return null;

  const progressPercentage = importStats.total > 0 
    ? Math.min(100, Math.round((importStats.processed / importStats.total) * 100))
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => step !== 3 && onClose()} // Prevent close during import
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {step === 1 && "Import Excel - Étape 1 : Téléchargement"}
                {step === 2 && "Import Excel - Étape 2 : Prévisualisation"}
                {step === 3 && "Importation en cours..."}
                {step === 4 && "Importation Terminée"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Mettez à jour le stock en masse via Excel</p>
            </div>
            {step !== 3 && (
              <button onClick={() => { reset(); onClose(); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {step === 1 && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileSpreadsheet className="h-10 w-10 text-emerald-500 mb-2" />
                      <p className="font-semibold text-slate-700">{file.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-slate-400 mb-2" />
                      <p className="font-semibold text-slate-700">Sélectionnez un fichier Excel</p>
                      <p className="text-sm text-slate-500 mt-1">Glissez-déposez ou cliquez ici</p>
                    </div>
                  )}
                </div>

                {importStats.errors.length > 0 && !previewData && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{importStats.errors[0].error}</p>
                  </div>
                )}
                
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm">
                  <p className="font-semibold mb-1">Format attendu :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Article Code</strong> (Requis)</li>
                    <li><strong>Quantity</strong> (Nombre positif, Requis)</li>
                    <li><strong>Location</strong> (Optionnel)</li>
                    <li><strong>Fournisseur ID</strong> (Optionnel)</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 2 && previewData && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-emerald-600">{previewData.successCount}</span>
                    <span className="text-sm text-slate-500 font-medium">Lignes Valides</span>
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-rose-600">{previewData.failedCount}</span>
                    <span className="text-sm text-slate-500 font-medium">Erreurs</span>
                  </div>
                </div>

                {previewData.failedCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm">
                    <div className="flex items-start gap-3 font-semibold mb-2">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p>Certaines lignes contiennent des erreurs et <strong>ne seront pas importées</strong>.</p>
                    </div>
                    <button onClick={downloadErrors} className="mt-2 px-4 py-2 bg-white border border-amber-200 rounded-lg shadow-sm text-amber-700 hover:bg-amber-100 flex items-center gap-2">
                      <Download className="h-4 w-4" /> Télécharger les erreurs
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-4">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Nom</th>
                          <th className="px-4 py-3">Quantité</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3">Erreur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.previewRows.slice(0, 100).map((row, idx) => (
                          <tr key={idx} className={`border-b border-slate-100 ${row.Status === 'Error' ? 'bg-rose-50/30' : 'hover:bg-slate-50'}`}>
                            <td className="px-4 py-3 font-medium text-slate-900">{row["Article Code"] || "-"}</td>
                            <td className="px-4 py-3">{row["Article Name"] || "-"}</td>
                            <td className="px-4 py-3">{row["Quantity"] || "-"}</td>
                            <td className="px-4 py-3">
                              {row.Status === "Valid" ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-semibold">Valide</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-semibold">Erreur</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-rose-600">{row.Error || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.previewRows.length > 100 && (
                      <div className="p-3 text-center text-sm text-slate-500 bg-slate-50">... et {previewData.previewRows.length - 100} autres lignes</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 max-w-2xl mx-auto py-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Importation de vos données...</h3>
                  <p className="text-slate-500">
                    {file?.name} - {importStats.total} lignes à importer
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2" aria-live="polite" aria-busy="true">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>Progression</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                    <motion.div 
                      className="bg-blue-600 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.3 }}
                      role="progressbar"
                      aria-valuenow={progressPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{importStats.processed} / {importStats.total} articles traités</span>
                    <span>Batch : {importStats.currentBatch} / {importStats.totalBatches}</span>
                  </div>
                </div>

                {/* Stages */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    {stage > 1 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                    <span className={`font-medium ${stage >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>Lecture du fichier Excel</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {stage > 2 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : (stage === 2 ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-200" />)}
                    <span className={`font-medium ${stage >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Validation des données</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {stage > 3 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : (stage === 3 ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-200" />)}
                    <span className={`font-medium ${stage >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>Importation dans la base de données</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {stage === 4 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : (stage === 4 ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-200" />)}
                    <span className={`font-medium ${stage === 4 ? 'text-slate-800' : 'text-slate-400'}`}>Finalisation</span>
                  </div>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <p className="text-sm text-slate-500">Importés</p>
                    <p className="text-xl font-bold text-emerald-600">{importStats.imported}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <p className="text-sm text-slate-500">Ignorés</p>
                    <p className="text-xl font-bold text-amber-600">{importStats.skipped}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <p className="text-sm text-slate-500">Erreurs</p>
                    <p className="text-xl font-bold text-rose-600">{importStats.errors.length}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <div className="p-4 bg-white rounded-full shadow-md">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-2xl">
                      {cancelledRef.current ? "Importation annulée" : "Importation terminée"}
                    </h3>
                    <p className="text-slate-600 mt-2 text-lg">
                      <strong className="text-slate-900">{importStats.processed}</strong> lignes traitées sur {importStats.total}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-emerald-600">{importStats.imported}</span>
                    <span className="text-sm text-slate-500 font-medium">Importés avec succès</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-amber-600">{importStats.skipped}</span>
                    <span className="text-sm text-slate-500 font-medium">Lignes ignorées</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-rose-600">{importStats.errors.length}</span>
                    <span className="text-sm text-slate-500 font-medium">Erreurs rencontrées</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-blue-600">{importStats.totalBatches}</span>
                    <span className="text-sm text-slate-500 font-medium">Batchs exécutés</span>
                  </div>
                </div>

                {importStats.errors.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 font-semibold">
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                      <p>Il y a eu des erreurs ou des lignes ignorées.</p>
                    </div>
                    <button onClick={downloadErrors} className="px-4 py-2 bg-white border border-amber-200 rounded-lg shadow-sm text-amber-700 hover:bg-amber-100 flex items-center gap-2 font-medium">
                      <Download className="h-4 w-4" /> Voir le rapport
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            {step === 4 ? (
              <button onClick={() => { reset(); onClose(); }} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors">
                Fermer
              </button>
            ) : step === 3 ? (
              <button 
                onClick={cancelImport} 
                disabled={cancelledRef.current}
                className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 font-medium hover:bg-rose-50 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {cancelledRef.current ? "Annulation en cours..." : "Annuler l'import"}
              </button>
            ) : (
              <>
                <button onClick={() => { reset(); onClose(); }} className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm" disabled={loading}>
                  Annuler
                </button>
                
                {step === 1 && (
                  <button onClick={handleValidateAndPreview} disabled={!file || loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Prévisualiser
                  </button>
                )}

                {step === 2 && (
                  <button onClick={handleImport} disabled={!previewData?.canImport || loading} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Confirmer l&apos;importation
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
