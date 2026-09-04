/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { CheckCircle2, ChevronLeft, Save, AlertCircle, FileDown } from 'lucide-react';

export default function TestPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const testId = unwrappedParams.testId;
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({}); // { itemId: boolean }
  const [submitting, setSubmitting] = useState(false);



  const [confirmModal, setConfirmModal] = useState(false);

  const fetchTest = useCallback(async () => {
    try {
      const res = await API.get(`/certification/tests/${testId}`);
      setTest(res.data);
      
      // Init answers
      const initAnswers = {};
      (res.data.items || []).forEach(item => {
        if (item.isConforme !== null) {
          initAnswers[item.id] = item.isConforme;
        }
      });
      setAnswers(initAnswers);
    } catch (err) {
      setError("Impossible de charger le test ou vous n'avez pas l'accès.");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  const handleAnswer = (itemId, isConforme) => {
    if (test?.resultat === 'REUSSI' || test?.resultat === 'ECHOUE') return; // Read-only if already submitted
    setAnswers(prev => ({ ...prev, [itemId]: isConforme }));
  };

  const handleSubmit = async () => {
    const itemsLength = test.items?.length || 0;
    if (itemsLength === 0) {
      alert("Ce test ne contient aucune question.");
      return;
    }
    if (itemsLength !== Object.keys(answers).length) {
      alert("Veuillez répondre à toutes les questions avant de terminer.");
      return;
    }
    
    setConfirmModal(true);
  };

  const executeSubmit = async () => {
    try {
      setSubmitting(true);
      setConfirmModal(false);
      
      const payload = {
        items: Object.keys(answers).map(id => ({
          id: id,
          isConforme: answers[id]
        }))
      };

      const res = await API.post(`/certification/tests/${testId}/submit`, payload);
      
      setTest(res.data); // Update with final result
      alert(`Test terminé ! Résultat: ${res.data.resultat} (${res.data.score.toFixed(0)}%)`);
      router.push('/formation');
    } catch (err) {
      alert(err?.error || err?.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Chargement du test...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;
  if (!test) return null;

  const isCompleted = test.resultat === 'REUSSI' || test.resultat === 'ECHOUE';

  return (
    <div className="max-w-4xl mx-auto p-4 pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-blue-600 transition">
          <ChevronLeft className="w-5 h-5 mr-1" /> Retour
        </button>
        <button 
          onClick={async () => {
            const { generateTestPDF } = await import('@/lib/pdfGenerator');
            generateTestPDF(test, isCompleted);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Télécharger Checklist PDF
        </button>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Évaluation de Certification : {test.niveauEvalue}</h1>
            <p className="text-blue-100 mt-1">Candidat : {test.technicien?.nom} ({test.technicien?.matricule})</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Superviseur ayant planifié : {test.superviseur?.nom}</p>
            <p className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full inline-block mt-2">
              Seuil de passage : 80%
            </p>
          </div>
        </div>

        {!isCompleted && (
          <div className="bg-yellow-50 border-b border-yellow-100 p-4 flex items-center justify-center text-yellow-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 mr-2" />
            Espace d&apos;examen réservé au technicien. L&apos;évaluation et le score seront calculés automatiquement.
          </div>
        )}
        
        {isCompleted && (
          <div className={`p-4 mx-6 mt-6 rounded-xl border flex items-center gap-3 ${
            test.resultat === 'REUSSI' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold">Test {test.resultat} avec {test.score?.toFixed(0)}%</p>
              <p className="text-sm">Le test est clôturé.</p>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Questions de l&apos;évaluation</h2>
            <span className="text-sm font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              Progression : {Object.keys(answers).length} / {test.items?.length || 0}
            </span>
          </div>
          
          <div className="space-y-4">
            {(test.items || []).map((item, index) => (
              <div key={item.id} className="p-4 border rounded-xl hover:shadow-sm transition bg-gray-50 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{item.category}</span>
                  <div className="mt-1">
                    <p className="font-medium text-gray-800">{index + 1}. {item.question}</p>
                    {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      {item.required ? `(${item.points} pt${item.points > 1 ? 's' : ''})` : '(Non noté)'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleAnswer(item.id, true)}
                    disabled={isCompleted}
                    className={`px-4 py-2 rounded-lg font-bold border transition ${
                      answers[item.id] === true 
                        ? 'bg-green-600 text-white border-green-600' 
                        : 'bg-white text-gray-500 hover:border-green-600 hover:text-green-600 disabled:opacity-50'
                    }`}
                  >
                    Conforme
                  </button>
                  <button 
                    onClick={() => handleAnswer(item.id, false)}
                    disabled={isCompleted}
                    className={`px-4 py-2 rounded-lg font-bold border transition ${
                      answers[item.id] === false 
                        ? 'bg-red-600 text-white border-red-600' 
                        : 'bg-white text-gray-500 hover:border-red-600 hover:text-red-600 disabled:opacity-50'
                    }`}
                  >
                    Non Conforme
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!isCompleted && (
            <div className="pt-6 border-t flex justify-end">
              <button 
                onClick={handleSubmit}
                disabled={submitting || !(test.items?.length > 0) || (test.items?.length || 0) !== Object.keys(answers).length}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-500 disabled:opacity-50 transition"
              >
                <Save className="w-5 h-5" />
                {submitting ? 'Enregistrement...' : 'Terminer le test'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-blue-600 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Terminer le test
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir terminer ce test ? <br/><br/>
                  <span className="font-semibold text-red-600">Cette action est irréversible et le score sera calculé définitivement.</span>
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  onClick={executeSubmit}
                  className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={submitting}
                >
                  {submitting ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
