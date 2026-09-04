import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download, Eye } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { preventiveService } from "../services/preventiveService";

export default function PreventiveImportWizard({ isOpen, onClose, onRefresh, user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [previewData, setPreviewData] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        setError("Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls).");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setPreviewData(null);
      setResults(null);
      setStep(1);
    }
  };

  const handleValidateAndPreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          
          if (workbook.SheetNames.length === 0) throw new Error("Le fichier Excel est vide.");

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval to ensure empty cells aren't omitted

          if (rows.length === 0) throw new Error("Aucune ligne de données trouvée dans le fichier.");

          const response = await preventiveService.validateImport(rows);
          setPreviewData({ rows: rows, ...response });
          setStep(2); 
        } catch (err) {
          setError(err.error || err.message || "Erreur lors du traitement du fichier Excel.");
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError("Erreur de lecture du fichier.");
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError("Une erreur inattendue est survenue.");
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData || !previewData.canImport) return;

    setLoading(true);
    setError(null);

    try {
      const response = await preventiveService.confirmImport(previewData.rows);
      setResults(response);
      if (response.successCount > 0) {
        onRefresh();
      }
      setStep(3);
    } catch (err) {
      setError(err.error || err.message || "Erreur lors de l'importation.");
    } finally {
      setLoading(false);
    }
  };

  const downloadErrors = () => {
    let rowsToDownload = [];
    if (step === 2 && previewData?.previewRows) {
        rowsToDownload = previewData.previewRows.filter(r => r.Status === "Error");
    } else if (step === 3 && results?.failedRows) {
        rowsToDownload = results.failedRows;
    }

    if (rowsToDownload.length === 0) return;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rowsToDownload);
    
    const headers = Object.keys(rowsToDownload[0]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    
    XLSX.utils.book_append_sheet(wb, ws, "Erreurs");
    XLSX.writeFile(wb, "erreurs_import_preventive.xlsx");
  };

  const downloadTemplate = () => {
      const wb = XLSX.utils.book_new();
      
      // Template Data
      const templateData = [
          { "Machine Code": "MCH-001", "Frequency": "MONTHLY", "Last Maintenance": "2024-01-15", "Next Maintenance": "", "Technician": "TECH-01", "Description": "Nettoyage filtres" },
          { "Machine Code": "MCH-002", "Frequency": "QUARTERLY", "Last Maintenance": "", "Next Maintenance": "2024-04-01", "Technician": "", "Description": "Lubrification globale" }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Styling and widths
      ws['!cols'] = [
          { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 40 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Modèle Import");

      // Reference Data
      const refData = [
          { "Fréquences Autorisées": "DAILY", "Description": "Quotidien" },
          { "Fréquences Autorisées": "WEEKLY", "Description": "Hebdomadaire" },
          { "Fréquences Autorisées": "MONTHLY", "Description": "Mensuel" },
          { "Fréquences Autorisées": "QUARTERLY", "Description": "Trimestriel" },
          { "Fréquences Autorisées": "SEMI_ANNUALLY", "Description": "Semestriel" },
          { "Fréquences Autorisées": "ANNUALLY", "Description": "Annuel" },
      ];
      const refWs = XLSX.utils.json_to_sheet(refData);
      refWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, refWs, "Référence");

      XLSX.writeFile(wb, "modele_import_preventive.xlsx");
  }

  const reset = () => {
    setFile(null);
    setPreviewData(null);
    setResults(null);
    setError(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Importation Massive de Plans Préventifs
              </h2>
              <p className="text-sm text-slate-500 mt-1">Étape {step} sur 3</p>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {step === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex justify-end">
                    <button onClick={downloadTemplate} className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-2">
                        <Download className="w-4 h-4" /> Télécharger le modèle Excel
                    </button>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileSpreadsheet className="h-12 w-12 text-emerald-500 mb-3" />
                      <p className="font-semibold text-slate-700">{file.name}</p>
                      <p className="text-sm text-slate-500 mt-1">Cliquez pour changer de fichier</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-slate-400 mb-3" />
                      <p className="font-semibold text-slate-700">Sélectionnez le fichier complété</p>
                      <p className="text-sm text-slate-500 mt-1">Glissez-déposez ou cliquez ici (.xlsx)</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            )}

            {step === 2 && previewData && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white border border-emerald-200 rounded-xl p-4 flex flex-col justify-center items-center shadow-sm">
                    <span className="text-3xl font-bold text-emerald-600">{previewData.successCount}</span>
                    <span className="text-sm text-slate-500 font-medium">Lignes Prêtes</span>
                  </div>
                  <div className="flex-1 bg-white border border-rose-200 rounded-xl p-4 flex flex-col justify-center items-center shadow-sm">
                    <span className="text-3xl font-bold text-rose-600">{previewData.failedCount}</span>
                    <span className="text-sm text-slate-500 font-medium">Erreurs</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {previewData.failedCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm">
                    <div className="flex items-start gap-3 font-semibold mb-2">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p>Certaines lignes contiennent des erreurs. Les lignes valides seront importées, les autres ignorées.</p>
                    </div>
                    <button onClick={downloadErrors} className="mt-2 px-4 py-2 bg-white border border-amber-200 rounded-lg shadow-sm text-amber-700 hover:bg-amber-100 flex items-center gap-2">
                      <Download className="h-4 w-4" /> Exporter les erreurs
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-4">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Machine</th>
                          <th className="px-4 py-3">Fréquence</th>
                          <th className="px-4 py-3">Prochaine</th>
                          <th className="px-4 py-3">Technicien</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3">Détail Erreur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.previewRows.map((row, idx) => (
                          <tr key={idx} className={`border-b border-slate-100 ${row.Status === 'Error' ? 'bg-rose-50/30' : 'hover:bg-slate-50'}`}>
                            <td className="px-4 py-3 font-medium text-slate-900">{row["Machine Code"] || "-"}</td>
                            <td className="px-4 py-3">{row["Frequency"] || "-"}</td>
                            <td className="px-4 py-3">{row["Next Maintenance"] || "Auto"}</td>
                            <td className="px-4 py-3">{row["Technician"] || "-"}</td>
                            <td className="px-4 py-3">
                              {row.Status === "Valid" ? (
                                <span className="inline-flex items-center text-emerald-600"><CheckCircle2 className="h-4 w-4 mr-1" /> OK</span>
                              ) : (
                                <span className="inline-flex items-center text-rose-600"><AlertCircle className="h-4 w-4 mr-1" /> Erreur</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-rose-600 text-xs">{row.Error || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && results && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl">Importation Terminée avec Succès</h3>
                    <p className="text-slate-600 mt-1">
                      <strong className="text-slate-800">{results.successCount}</strong> plans préventifs ont été créés et ajoutés au calendrier.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            {step === 3 ? (
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Fermer et Voir le planning
              </button>
            ) : (
              <>
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
                  disabled={loading}
                >
                  Annuler
                </button>
                
                {step === 1 && (
                  <button
                    onClick={handleValidateAndPreview}
                    disabled={!file || loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Vérifier les données
                  </button>
                )}

                {step === 2 && (
                  <button
                    onClick={handleImport}
                    disabled={!previewData?.canImport || loading}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Confirmer la création
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
