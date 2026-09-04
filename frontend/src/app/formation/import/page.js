'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileDown, CheckCircle, XCircle, ChevronLeft, AlertTriangle } from 'lucide-react';
import API from '@/lib/api';
import * as XLSX from 'xlsx-js-style';

export default function ImportChecklistsPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Download Excel Template
  const handleDownloadTemplate = () => {
    // Data sheet
    const data = [
      { Niveau: 'Niveau 1', Catégorie: 'Sécurité', Question: 'Vérifier les EPI', Description: 'Contrôle avant intervention', Points: 1, Required: 'Oui', 'Réponse correcte': 'CONFORME', Ordre: 1 },
      { Niveau: 'Niveau 1', Catégorie: 'Sécurité', Question: 'Respecter les consignes', Description: 'Consignes sécurité', Points: 1, Required: 'Oui', 'Réponse correcte': 'CONFORME', Ordre: 2 },
      { Niveau: 'Niveau 1', Catégorie: 'Procédure', Question: 'Suivre la procédure', Description: 'Procédure standard', Points: 2, Required: 'Oui', 'Réponse correcte': 'CONFORME', Ordre: 3 },
      { Niveau: 'Niveau 2', Catégorie: 'Technique', Question: 'Intervenir sur une machine sous tension', Description: 'Intervention interdite sous tension', Points: 2, Required: 'Oui', 'Réponse correcte': 'NON_CONFORME', Ordre: 1 },
    ];
    const wsData = XLSX.utils.json_to_sheet(data);

    // Style headers
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E40AF" } } };
    const range = XLSX.utils.decode_range(wsData['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (wsData[address]) wsData[address].s = headerStyle;
    }
    wsData['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 10 }];

    // Instructions sheet
    const instrData = [
      { Champ: 'Niveau', 'Valeurs Acceptées': 'Niveau 1, Niveau 2, Niveau 3, Expert', Obligatoire: 'Oui' },
      { Champ: 'Catégorie', 'Valeurs Acceptées': 'Texte libre (ex: Sécurité, Qualité)', Obligatoire: 'Oui' },
      { Champ: 'Question', 'Valeurs Acceptées': 'Texte libre', Obligatoire: 'Oui' },
      { Champ: 'Description', 'Valeurs Acceptées': 'Texte libre', Obligatoire: 'Non' },
      { Champ: 'Points', 'Valeurs Acceptées': 'Nombre entier > 0', Obligatoire: 'Non (défaut: 1)' },
      { Champ: 'Required', 'Valeurs Acceptées': 'Oui, Non, True, False, 1, 0', Obligatoire: 'Non (défaut: Oui)' },
      { Champ: 'Réponse correcte', 'Valeurs Acceptées': 'CONFORME, NON_CONFORME, Oui, Non, True, False, 1, 0', Obligatoire: 'Oui' },
      { Champ: 'Ordre', 'Valeurs Acceptées': 'Nombre entier', Obligatoire: 'Non (auto-généré si vide)' },
    ];
    const wsInstr = XLSX.utils.json_to_sheet(instrData);
    wsInstr['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 25 }];
    const instrRange = XLSX.utils.decode_range(wsInstr['!ref']);
    for (let C = instrRange.s.c; C <= instrRange.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (wsInstr[address]) wsInstr[address].s = headerStyle;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Template');
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

    XLSX.writeFile(wb, 'Modele_Import_Checklists.xlsx');
  };

  // 2. Handle File Selection
  const onFileChange = async (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewData(null);
      setErrorMsg('');
      setImportSuccess(null);
      await parseAndPreview(selected);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setPreviewData(null);
      setErrorMsg('');
      setImportSuccess(null);
      await parseAndPreview(dropped);
    }
  };

  // 3. Parse and Send to Backend for Validation (Preview)
  const parseAndPreview = async (f) => {
    setIsAnalyzing(true);
    try {
      const data = await f.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        setErrorMsg('Le fichier est vide.');
        setIsAnalyzing(false);
        return;
      }

      // Send to backend for preview/validation
      const token = localStorage.getItem('token');
      const res = await API.post('/certification/templates/import', 
        { rows: json, confirm: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPreviewData(res.data);
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de l'analyse du fichier Excel.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Confirm Import
  const handleConfirmImport = async () => {
    if (!previewData || previewData.errors > 0) return;
    
    setIsImporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await API.post('/certification/templates/import', 
        { rows: previewData.previewRows, confirm: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImportSuccess(res.data);
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de l'importation.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-blue-600 transition">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour au tableau de bord
        </button>
        <button onClick={handleDownloadTemplate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
          <FileDown className="w-4 h-4" />
          Télécharger modèle Excel
        </button>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Import Checklist / Tests</h1>
        <p className="text-gray-500 mb-8">Importez les modèles de checklists pour chaque niveau de certification. Les anciens tests ne seront pas affectés.</p>

        {!importSuccess ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            >
              <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${file ? 'text-blue-500' : 'text-gray-400'}`} />
              {file ? (
                <div>
                  <p className="text-sm font-bold text-blue-800">{file.name}</p>
                  <p className="text-xs text-blue-600 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-600">Glissez-déposez votre fichier Excel / CSV ici</p>
                  <p className="text-xs text-gray-400 mt-2">ou</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-4 py-2 bg-white border rounded shadow-sm text-sm font-bold hover:bg-gray-50"
                  >
                    Choisir un fichier
                  </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
              />
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Analyse du fichier en cours...</p>
              </div>
            )}

            {/* Preview Section */}
            {previewData && !isAnalyzing && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-500 font-medium">Lignes analysées</p>
                    <p className="text-2xl font-bold">{previewData.total}</p>
                  </div>
                  <div className="p-4 border rounded-xl bg-green-50 border-green-100">
                    <p className="text-sm text-green-600 font-medium">Lignes valides</p>
                    <p className="text-2xl font-bold text-green-700">{previewData.valid}</p>
                  </div>
                  <div className="p-4 border rounded-xl bg-red-50 border-red-100">
                    <p className="text-sm text-red-600 font-medium">Erreurs détectées</p>
                    <p className="text-2xl font-bold text-red-700">{previewData.errors}</p>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  {Object.entries(previewData.breakdown).map(([niveau, count]) => (
                    <div key={niveau} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
                      {niveau}: {count} questions
                    </div>
                  ))}
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-3 border-b font-semibold text-gray-600">Statut</th>
                          <th className="p-3 border-b font-semibold text-gray-600">Niveau</th>
                          <th className="p-3 border-b font-semibold text-gray-600">Catégorie</th>
                          <th className="p-3 border-b font-semibold text-gray-600">Question</th>
                          <th className="p-3 border-b font-semibold text-gray-600">Réponse correcte</th>
                          <th className="p-3 border-b font-semibold text-gray-600">Pts</th>
                          <th className="p-3 border-b font-semibold text-gray-600">Req</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.previewRows.map((row, i) => (
                          <tr key={i} className={`border-b ${!row._valid ? 'bg-red-50' : ''}`}>
                            <td className="p-3">
                              {row._valid ? (
                                <span className="inline-flex items-center text-green-600 font-medium"><CheckCircle className="w-4 h-4 mr-1"/> Valide</span>
                              ) : (
                                <div className="text-red-600 text-xs">
                                  <span className="inline-flex items-center font-bold mb-1"><XCircle className="w-4 h-4 mr-1"/> Erreur</span>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {row._errors.map((e, idx) => <li key={idx}>{e}</li>)}
                                  </ul>
                                </div>
                              )}
                            </td>
                            <td className="p-3">{row.Niveau}</td>
                            <td className="p-3">{row['Catégorie']}</td>
                            <td className="p-3">{row.Question}</td>
                            <td className="p-3">
                              {row._valid && row.isConforme !== undefined && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  row.isConforme ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.isConforme ? 'CONFORME' : 'NON CONFORME'}
                                </span>
                              )}
                              {!row._valid && row['Réponse correcte'] && (
                                <span className="text-gray-500 text-xs">{row['Réponse correcte']}</span>
                              )}
                            </td>
                            <td className="p-3">{row.Points}</td>
                            <td className="p-3">{row.Required}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button onClick={() => { setPreviewData(null); setFile(null); }} className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg">
                    Annuler
                  </button>
                  <button 
                    onClick={handleConfirmImport} 
                    disabled={previewData.errors > 0 || isImporting}
                    className="px-6 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isImporting ? 'Importation...' : `Importer ${previewData.valid} lignes`}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success Screen */
          <div className="text-center py-12 space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Import Terminé avec Succès !</h2>
              <p className="text-gray-500 mt-2">Les modèles de checklists ont été mis à jour.</p>
            </div>

            <div className="max-w-sm mx-auto bg-gray-50 border rounded-xl p-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Questions importées:</span>
                <span className="font-bold text-gray-800">{importSuccess.totalImported}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Templates créés:</span>
                <span className="font-bold text-gray-800">{importSuccess.templatesCreated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Templates mis à jour:</span>
                <span className="font-bold text-gray-800">{importSuccess.templatesUpdated}</span>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Répartition par niveau</p>
                {Object.entries(importSuccess.breakdown).map(([niveau, count]) => (
                  <div key={niveau} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">{niveau}</span>
                    <span className="font-semibold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button onClick={() => router.push('/formation')} className="px-6 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500">
                Retour au tableau de bord
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
