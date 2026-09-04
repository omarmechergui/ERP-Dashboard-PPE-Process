/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import {
  GraduationCap,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle,
  XCircle,
  Users,
  Search,
  MoreVertical,
  ChevronRight,
  Medal,
  Clock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import API from '@/lib/api';
import Link from 'next/link';
import { FileDown } from 'lucide-react';

export default function FormationDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [techniciens, setTechniciens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState(null);
  const { user } = useAuth();
  const userRole = user?.role || '';
  const userId = user?.id || null;
  
  // Modal for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, item: null });
  // Modal for scheduling
  const [scheduleModal, setScheduleModal] = useState({ isOpen: false, techId: null, date: new Date().toISOString().split('T')[0], formationId: '' });
  const [techFormations, setTechFormations] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [dashRes, techRes] = await Promise.all([
        API.get(`/certification/dashboard`),
        API.get(`/certification/techniciens`)
      ]);

      setDashboardData(dashRes.data);
      setTechniciens(techRes.data);
    } catch (error) {
      console.error("Erreur de chargement", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openTechDetails = async (techId) => {
    try {
      const res = await API.get(`/certification/techniciens/${techId}`);
      setSelectedTech(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const openScheduleModal = async (techId) => {
    try {
      const res = await API.get(`/certification/formations/${techId}`);
      setTechFormations(res.data);
    } catch (error) {
      setTechFormations([]);
    }
    setScheduleModal({
      isOpen: true,
      techId,
      date: new Date().toISOString().split('T')[0],
      formationId: ''
    });
  };

  const submitScheduleTest = async () => {
    const { techId, date, formationId } = scheduleModal;
    
    // Validate date before toISOString
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      alert("La date spécifiée est invalide.");
      return;
    }

    try {
      await API.post(`/certification/tests`, {
        techId,
        dateTest: parsedDate.toISOString(),
        formationId: formationId || null
      });
      alert('Test planifié avec succès !');
      setScheduleModal({ isOpen: false, techId: null, date: '', formationId: '' });
      fetchData();
      openTechDetails(techId);
    } catch (error) {
      alert("Erreur lors de la planification");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.item) return;
    
    try {
      if (deleteConfirm.type === 'TEST') {
        await API.delete(`/certification/tests/${deleteConfirm.item.id}`);
      } else if (deleteConfirm.type === 'BADGE') {
        await API.delete(`/certification/badges/${deleteConfirm.item.badgeId}`);
      }
      
      setDeleteConfirm({ isOpen: false, type: null, item: null });
      fetchData();
      if (selectedTech) openTechDetails(selectedTech.id);
    } catch (error) {
      alert(error.response?.data?.error || "Erreur lors de la suppression.");
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Chargement...</div>;
  }

  const kpis = dashboardData || {};

  return (
    <div className="max-w-[1600px] mx-auto p-4 pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          Formation & Certification
        </h1>
        <div className="flex gap-2">
          {userRole === 'ADMIN' && (
            <Link 
              href="/formation/questions"
              className="px-4 py-2 bg-slate-900 text-white border rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 flex items-center gap-2 transition"
            >
              ⚙️ Gestion des Questions
            </Link>
          )}
          <button onClick={fetchData} className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Total Techniciens" value={kpis.total} icon={Users} color="blue" />
        <KpiCard title="Tests Aujourd'hui" value={kpis.testsAujourdHui} icon={CalendarDays} color="orange" />
        <KpiCard title="Tests Réussis" value={kpis.testsReussis} icon={CheckCircle} color="green" />
        <KpiCard title="Tests Échoués" value={kpis.testsEchoues} icon={XCircle} color="red" />
        <KpiCard title="Experts" value={kpis.experts} icon={Award} color="purple" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <KpiCard title="En Formation" value={kpis.enFormation} icon={BookOpen} color="gray" />
        <KpiCard title="Niveau 1 (Bronze)" value={kpis.niveau1} icon={Medal} color="yellow" />
        <KpiCard title="Niveau 2 (Silver)" value={kpis.niveau2} icon={Medal} color="slate" />
        <KpiCard title="Niveau 3 (Gold)" value={kpis.niveau3} icon={Medal} color="amber" />
      </div>

      {/* Certification KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <KpiCard title="Certifications Valides" value={kpis.certificationsValides || 0} icon={Award} color="green" />
        <KpiCard title="Expirant Bientôt" value={kpis.certificationsExpirantBientot || 0} icon={AlertTriangle} color="orange" />
        <KpiCard title="Certifications Expirées" value={kpis.certificationsExpirees || 0} icon={XCircle} color="red" />
      </div>

      {/* Technicians List */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Techniciens / Progression</h2>
          <div className="flex items-center gap-3">
            {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
              <Link 
                href="/formation/import"
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2 text-sm"
              >
                Importer Checklists
              </Link>
            )}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Technicien</th>
                <th className="px-6 py-4 font-medium">Matricule</th>
                <th className="px-6 py-4 font-medium">Niveau Actuel</th>
                <th className="px-6 py-4 font-medium">Prochain Test</th>
                <th className="px-6 py-4 font-medium">Statut Test</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {techniciens.filter(t => (t.nom || '').toLowerCase().includes((searchTerm || '').toLowerCase())).map((tech) => {
                const latestTest = tech.formationTests?.[0];
                const isToday = latestTest?.dateTest && new Date(latestTest.dateTest).toDateString() === new Date().toDateString();

                return (
                  <tr key={tech.id} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => openTechDetails(tech.id)}>
                    <td className="px-6 py-4 font-medium text-gray-900">{tech.nom}</td>
                    <td className="px-6 py-4 text-gray-500">{tech.matricule}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tech.currentNiveau || 'Débutant'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {tech.nextTestDate ? new Date(tech.nextTestDate).toLocaleDateString() : 'Non planifié'}
                    </td>
                    <td className="px-6 py-4">
                      {isToday && latestTest?.resultat === 'A_VENIR' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                          Aujourd&apos;hui
                        </span>
                      ) : (
                        <span className="text-gray-400">{latestTest?.resultat || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {techniciens.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Aucun technicien trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Modal */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedTech(null)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Détails Technicien</h2>
              <button onClick={() => setSelectedTech(null)} className="text-gray-400 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedTech.nom.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedTech.nom}</h3>
                  <p className="text-sm text-gray-500">{selectedTech.matricule} • {selectedTech.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">Niveau Actuel</p>
                  <p className="text-xl font-bold text-blue-900">{selectedTech.currentNiveau || 'Débutant'}</p>
                  {/* Progress Bar placeholder for progression */}
                  <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: selectedTech.currentNiveau === 'Expert' ? '100%' : selectedTech.currentNiveau === 'Niveau 3' ? '75%' : selectedTech.currentNiveau === 'Niveau 2' ? '50%' : selectedTech.currentNiveau === 'Niveau 1' ? '25%' : '5%' }}></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">Prochain Test</p>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedTech.nextTestDate ? new Date(selectedTech.nextTestDate).toLocaleDateString() : 'Aucun'}
                  </p>
                </div>
              </div>

              {/* Action - Only for Supervisors/Managers scheduling for others */}
              {(userRole !== 'TECHNICIEN' && userRole !== 'TECHNICIENSTOCK' && selectedTech.id !== userId) && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-orange-900">Évaluation</p>
                    <p className="text-sm text-orange-700">Assigner et planifier le prochain test de certification.</p>
                  </div>
                  <button 
                    onClick={() => openScheduleModal(selectedTech.id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-orange-500"
                  >
                    Planifier
                  </button>
                </div>
              )}

              {/* Tests */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Historique des Tests
                </h4>
                <div className="space-y-3">
                  {selectedTech.formationTests?.map(test => (
                    <div key={test.id} className="relative group p-4 border rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{test.niveauEvalue} - {new Date(test.dateTest).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Superviseur: {test.superviseur?.nom || '-'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                          test.resultat === 'REUSSI' ? 'bg-green-100 text-green-800' :
                          test.resultat === 'ECHOUE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {test.resultat} {test.score != null && `(${test.score.toFixed(0)}%)`}
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={async () => {
                              const { generateTestPDF } = await import('@/lib/pdfGenerator');
                              try {
                                const res = await API.get(`/certification/tests/${test.id}`);
                                const isFilled = res.data.resultat === 'REUSSI' || res.data.resultat === 'ECHOUE';
                                generateTestPDF(res.data, isFilled);
                              } catch (e) {
                                alert('Erreur lors de la génération du PDF.');
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            PDF
                          </button>
                          {test.resultat === 'A_VENIR' && (
                            <>
                              {(Number(selectedTech.id) === Number(userId) || userRole === 'ADMIN') ? (
                                <Link 
                                  href={`/formation/test/${test.id}`} 
                                  className="inline-block px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-500 transition-colors"
                                >
                                  Commencer le test
                                </Link>
                              ) : (
                                <span className="text-xs font-medium text-gray-500 italic">En attente</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {userRole === 'ADMIN' && (
                        <button 
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'TEST', item: test })}
                          className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer ce test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedTech.formationTests || selectedTech.formationTests.length === 0) && (
                    <p className="text-sm text-gray-400">Aucun test passé.</p>
                  )}
                </div>
              </div>

              {/* Formations */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  Formations Suivies
                </h4>
                <div className="space-y-3">
                  {selectedTech.formations?.map(form => (
                    <div key={form.id} className="p-4 border rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{form.formationName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(form.startDate).toLocaleDateString()} {form.endDate ? `- ${new Date(form.endDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                          form.certStatus === 'Certified' ? 'bg-green-100 text-green-800' :
                          form.certStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {form.certStatus} ({form.progress}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!selectedTech.formations || selectedTech.formations.length === 0) && (
                    <p className="text-sm text-gray-400">Aucune formation suivie.</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-gray-400" />
                  Certifications Officielles
                </h4>
                <div className="space-y-3">
                  {selectedTech.certifications?.map(cert => (
                    <div key={cert.id} className="p-4 border rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{cert.nom}</p>
                        <p className="text-xs text-gray-500">Obtenue le: {new Date(cert.dateObtention).toLocaleDateString()}</p>
                        {cert.dateExpiration && (
                          <p className="text-xs text-gray-500">Expire le: {new Date(cert.dateExpiration).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                          cert.statut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                          cert.statut === 'EXPIRANT_BIENTOT' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cert.statut.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!selectedTech.certifications || selectedTech.certifications.length === 0) && (
                    <p className="text-sm text-gray-400">Aucune certification.</p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-gray-400" />
                  Badges Obtenus
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTech.badges?.map(badge => (
                    <div key={badge.id} className="relative group">
                      <a href={`/badges/verify/${badge.badgeId}`} target="_blank" className="p-3 border rounded-xl hover:border-blue-300 transition-colors bg-white block text-center h-full">
                         <Medal className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                         <p className="text-sm font-bold text-gray-800">{badge.niveau}</p>
                         <p className="text-xs text-gray-400">{new Date(badge.dateObtention).toLocaleDateString()}</p>
                      </a>
                      {userRole === 'ADMIN' && (
                        <button 
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'BADGE', item: badge })}
                          className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-200 shadow-sm"
                          title="Supprimer ce badge"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedTech.badges || selectedTech.badges.length === 0) && (
                    <p className="text-sm text-gray-400 col-span-2">Aucun badge.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {deleteConfirm.type === 'TEST' ? 'Supprimer ce test ?' : 'Supprimer ce badge ?'}
                </h3>
              </div>
              
              <div className="mb-6 space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p><span className="font-semibold text-gray-500">Technicien:</span> {selectedTech?.nom}</p>
                {deleteConfirm.type === 'TEST' ? (
                  <>
                    <p><span className="font-semibold text-gray-500">Niveau:</span> {deleteConfirm.item.niveauEvalue}</p>
                    <p><span className="font-semibold text-gray-500">Date:</span> {new Date(deleteConfirm.item.dateTest).toLocaleDateString()}</p>
                    <p><span className="font-semibold text-gray-500">Score:</span> {deleteConfirm.item.score ? `${deleteConfirm.item.score.toFixed(0)}%` : '-'}</p>
                    <p><span className="font-semibold text-gray-500">Status:</span> {deleteConfirm.item.resultat}</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-semibold text-gray-500">Badge ID:</span> {deleteConfirm.item.badgeId}</p>
                    <p><span className="font-semibold text-gray-500">Niveau:</span> {deleteConfirm.item.niveau}</p>
                  </>
                )}
              </div>

              <p className="text-sm text-red-600 font-medium mb-6">⚠ Cette action est irréversible et supprimera les données associées.</p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, type: null, item: null })}
                  className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Confirmation Modal */}
      {scheduleModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-orange-600 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Planifier un test
                </h3>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date du test
                </label>
                <input 
                  type="date"
                  value={scheduleModal.date}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associer à une formation (Optionnel)
                </label>
                <select
                  value={scheduleModal.formationId}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, formationId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">-- Aucune formation associée --</option>
                  {techFormations.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.formationName} ({new Date(f.startDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setScheduleModal({ isOpen: false, techId: null, date: '' })}
                  className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitScheduleTest}
                  className="px-4 py-2 font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    red: 'bg-red-100 text-red-600 border-red-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    amber: 'bg-amber-100 text-amber-600 border-amber-200',
  };
  
  return (
    <div className={`p-4 border rounded-2xl flex items-center gap-4 bg-white shadow-sm`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
