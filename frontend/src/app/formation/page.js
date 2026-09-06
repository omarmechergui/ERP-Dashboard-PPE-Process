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
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingSkeleton';

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
    return <LoadingState type="dashboard" />;
  }

  const kpis = dashboardData || {};

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-12 space-y-8 animate-fade-in">
      <PageHeader 
        icon={GraduationCap}
        title="Formation & Certification"
        description="Gérez les compétences, les tests et les certifications des techniciens"
        action={
          <div className="flex gap-3">
            {userRole === 'ADMIN' && (
              <Link 
                href="/formation/questions"
                className="px-5 py-2.5 bg-foreground text-background rounded-xl text-sm font-bold shadow-md hover:bg-foreground/90 flex items-center gap-2 transition-all hover:-translate-y-0.5"
              >
                ⚙️ Gestion des Questions
              </Link>
            )}
            <button onClick={fetchData} className="px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all shadow-sm flex items-center gap-2">
              Actualiser
            </button>
          </div>
        }
      />
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <KpiCard title="Total Techniciens" value={kpis.total} icon={Users} color="blue" />
        <KpiCard title="Tests Aujourd'hui" value={kpis.testsAujourdHui} icon={CalendarDays} color="orange" />
        <KpiCard title="Tests Réussis" value={kpis.testsReussis} icon={CheckCircle} color="green" />
        <KpiCard title="Tests Échoués" value={kpis.testsEchoues} icon={XCircle} color="red" />
        <KpiCard title="Experts" value={kpis.experts} icon={Award} color="purple" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
        <KpiCard title="En Formation" value={kpis.enFormation} icon={BookOpen} color="gray" />
        <KpiCard title="Niveau 1 (Bronze)" value={kpis.niveau1} icon={Medal} color="yellow" />
        <KpiCard title="Niveau 2 (Silver)" value={kpis.niveau2} icon={Medal} color="slate" />
        <KpiCard title="Niveau 3 (Gold)" value={kpis.niveau3} icon={Medal} color="amber" />
      </div>

      {/* Certification KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4">
        <KpiCard title="Certifications Valides" value={kpis.certificationsValides || 0} icon={Award} color="green" />
        <KpiCard title="Expirant Bientôt" value={kpis.certificationsExpirantBientot || 0} icon={AlertTriangle} color="orange" />
        <KpiCard title="Certifications Expirées" value={kpis.certificationsExpirees || 0} icon={XCircle} color="red" />
      </div>

      {/* Technicians List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-slide-up">
        <div className="p-5 border-b border-border bg-accent/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Techniciens & Progression</h2>
          <div className="flex items-center gap-4">
            {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
              <Link 
                href="/formation/import"
                className="px-4 py-2 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-accent shadow-sm transition-colors flex items-center gap-2 text-sm"
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
                className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm w-72 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/40 text-secondary-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Technicien</th>
                <th className="px-6 py-4 font-semibold">Matricule</th>
                <th className="px-6 py-4 font-semibold">Niveau Actuel</th>
                <th className="px-6 py-4 font-semibold">Prochain Test</th>
                <th className="px-6 py-4 font-semibold">Statut Test</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {techniciens.filter(t => (t.nom || '').toLowerCase().includes((searchTerm || '').toLowerCase())).map((tech) => {
                const latestTest = tech.formationTests?.[0];
                const isToday = latestTest?.dateTest && new Date(latestTest.dateTest).toDateString() === new Date().toDateString();
                const isEligible = tech.isEligible; // assuming this is coming from the backend now

                return (
                  <tr key={tech.id} className="hover:bg-accent/50 cursor-pointer transition-colors group" onClick={() => openTechDetails(tech.id)}>
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {tech.nom.charAt(0)}
                      </div>
                      {tech.nom}
                    </td>
                    <td className="px-6 py-4 text-secondary-foreground">{tech.matricule}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {tech.currentNiveau || 'Débutant'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground">{tech.nextTestDate ? new Date(tech.nextTestDate).toLocaleDateString() : 'Non planifié'}</span>
                        {isEligible && <span className="text-[10px] text-success font-semibold tracking-wider uppercase mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Éligible: {tech.eligibilityReason}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isToday && latestTest?.resultat === 'A_VENIR' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning-foreground animate-pulse">
                          Aujourd&apos;hui
                        </span>
                      ) : (
                        <span className="text-secondary-foreground font-medium">{latestTest?.resultat || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 group-hover:text-primary transition-colors p-2 rounded-full group-hover:bg-primary/10">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {techniciens.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-secondary-foreground">Aucun technicien trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Modal */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedTech(null)} />
          <div className="relative w-full max-w-2xl bg-card h-full shadow-2xl flex flex-col animate-slide-up sm:animate-none border-l border-border">
            <div className="p-6 border-b border-border flex items-center justify-between bg-accent/30">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">Détails Technicien</h2>
              <button onClick={() => setSelectedTech(null)} className="text-secondary-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-full">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shadow-inner border border-primary/20">
                  {selectedTech.nom.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-foreground">{selectedTech.nom}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-bold">{selectedTech.matricule}</span>
                    <span className="text-sm text-secondary-foreground font-medium">{selectedTech.role}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/10 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500 ease-in-out"></div>
                  <div className="relative z-10">
                    <p className="text-xs text-primary font-bold uppercase tracking-wider">Niveau Actuel</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{selectedTech.currentNiveau || 'Débutant'}</p>
                    {/* Progress Bar placeholder for progression */}
                    <div className="w-full bg-primary/20 rounded-full h-2 mt-4 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: selectedTech.currentNiveau === 'Expert' ? '100%' : selectedTech.currentNiveau === 'Niveau 3' ? '75%' : selectedTech.currentNiveau === 'Niveau 2' ? '50%' : selectedTech.currentNiveau === 'Niveau 1' ? '25%' : '5%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-accent border border-border">
                  <p className="text-xs text-secondary-foreground font-bold uppercase tracking-wider">Prochain Test</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">
                    {selectedTech.nextTestDate ? new Date(selectedTech.nextTestDate).toLocaleDateString() : 'Aucun'}
                  </p>
                </div>
              </div>

              {/* Action - Only for Supervisors/Managers scheduling for others */}
              {(userRole !== 'TECHNICIEN' && userRole !== 'TECHNICIENSTOCK' && selectedTech.id !== userId) && (
                <div className="p-5 rounded-2xl bg-warning/10 border border-warning/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-warning-foreground flex items-center gap-2"><CalendarDays className="w-5 h-5"/> Évaluation</p>
                    <p className="text-sm text-foreground/80 mt-1 font-medium">Assigner et planifier le prochain test de certification.</p>
                  </div>
                  <button 
                    onClick={() => openScheduleModal(selectedTech.id)}
                    className="px-6 py-2.5 bg-warning text-warning-foreground rounded-xl text-sm font-bold shadow-md hover:bg-warning/90 transition-all hover:scale-105 whitespace-nowrap"
                  >
                    Planifier
                  </button>
                </div>
              )}

              {/* Tests */}
              <div>
                <h4 className="font-extrabold text-foreground mb-4 flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Historique des Tests
                </h4>
                <div className="space-y-3">
                  {selectedTech.formationTests?.map(test => (
                    <div key={test.id} className="relative group p-4 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card hover:border-primary/30 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-foreground">{test.niveauEvalue} - {new Date(test.dateTest).toLocaleDateString()}</p>
                        <p className="text-xs text-secondary-foreground font-medium mt-1">Superviseur: {test.superviseur?.nom || '-'}</p>
                      </div>
                      <div className="text-right flex flex-col sm:items-end gap-3">
                        <span className={`inline-flex px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${
                          test.resultat === 'REUSSI' ? 'bg-success/20 text-success' :
                          test.resultat === 'ECHOUE' ? 'bg-danger/20 text-danger' :
                          'bg-accent text-secondary-foreground'
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            PDF
                          </button>
                          {test.resultat === 'A_VENIR' && (
                            <>
                              {(Number(selectedTech.id) === Number(userId) || userRole === 'ADMIN') ? (
                                <Link 
                                  href={`/formation/test/${test.id}`} 
                                  className="inline-block px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm hover:bg-primary-hover transition-colors"
                                >
                                  Commencer le test
                                </Link>
                              ) : (
                                <span className="text-xs font-medium text-secondary-foreground italic">En attente</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {userRole === 'ADMIN' && (
                        <button 
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'TEST', item: test })}
                          className="absolute -top-2 -right-2 p-1.5 bg-danger/10 text-danger rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/20"
                          title="Supprimer ce test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedTech.formationTests || selectedTech.formationTests.length === 0) && (
                    <p className="text-sm text-secondary-foreground p-4 bg-accent/50 rounded-xl border border-dashed border-border text-center">Aucun test passé.</p>
                  )}
                </div>
              </div>

              {/* Formations */}
              <div>
                <h4 className="font-extrabold text-foreground mb-4 flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Formations Suivies
                </h4>
                <div className="space-y-3">
                  {selectedTech.formations?.map(form => (
                    <div key={form.id} className="p-4 border border-border rounded-xl flex items-center justify-between bg-card hover:bg-accent/30 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-foreground">{form.formationName}</p>
                        <p className="text-xs text-secondary-foreground font-medium mt-1">
                          {new Date(form.startDate).toLocaleDateString()} {form.endDate ? `- ${new Date(form.endDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          form.certStatus === 'Certified' ? 'bg-success/20 text-success' :
                          form.certStatus === 'In Progress' ? 'bg-primary/20 text-primary' :
                          'bg-accent text-secondary-foreground'
                        }`}>
                          {form.certStatus} ({form.progress}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!selectedTech.formations || selectedTech.formations.length === 0) && (
                    <p className="text-sm text-secondary-foreground p-4 bg-accent/50 rounded-xl border border-dashed border-border text-center">Aucune formation suivie.</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="font-extrabold text-foreground mb-4 flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-primary" />
                  Certifications Officielles
                </h4>
                <div className="space-y-3">
                  {selectedTech.certifications?.map(cert => (
                    <div key={cert.id} className="p-4 border border-border rounded-xl flex items-center justify-between bg-card hover:bg-accent/30 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-foreground">{cert.nom}</p>
                        <p className="text-xs text-secondary-foreground font-medium mt-1">Obtenue le: {new Date(cert.dateObtention).toLocaleDateString()}</p>
                        {cert.dateExpiration && (
                          <p className="text-xs text-secondary-foreground font-medium">Expire le: {new Date(cert.dateExpiration).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          cert.statut === 'VALIDE' ? 'bg-success/20 text-success' :
                          cert.statut === 'EXPIRANT_BIENTOT' ? 'bg-warning/20 text-warning-foreground' :
                          'bg-danger/20 text-danger'
                        }`}>
                          {cert.statut.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!selectedTech.certifications || selectedTech.certifications.length === 0) && (
                    <p className="text-sm text-secondary-foreground p-4 bg-accent/50 rounded-xl border border-dashed border-border text-center">Aucune certification.</p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div>
                <h4 className="font-extrabold text-foreground mb-4 flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-primary" />
                  Badges Obtenus
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {selectedTech.badges?.map(badge => (
                    <div key={badge.id} className="relative group">
                      <a href={`/badges/verify/${badge.badgeId}`} target="_blank" className="p-5 border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all bg-card block text-center h-full hover:-translate-y-1">
                         <Medal className="w-10 h-10 mx-auto mb-3 text-warning group-hover:scale-110 transition-transform" />
                         <p className="text-sm font-extrabold text-foreground">{badge.niveau}</p>
                         <p className="text-xs font-medium text-secondary-foreground mt-1">{new Date(badge.dateObtention).toLocaleDateString()}</p>
                      </a>
                      {userRole === 'ADMIN' && (
                        <button 
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'BADGE', item: badge })}
                          className="absolute -top-2 -right-2 p-1.5 bg-danger/10 text-danger rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-danger/20 shadow-sm"
                          title="Supprimer ce badge"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedTech.badges || selectedTech.badges.length === 0) && (
                    <p className="text-sm text-secondary-foreground p-4 bg-accent/50 rounded-xl border border-dashed border-border text-center col-span-full">Aucun badge obtenu.</p>
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
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-slate-50 text-slate-600 border-slate-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
  };
  
  return (
    <div className={`p-5 border-border border rounded-2xl flex items-center gap-4 bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up group`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${colorMap[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-secondary-foreground uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
