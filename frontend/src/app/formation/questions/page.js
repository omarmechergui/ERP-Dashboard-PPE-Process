/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import API from '@/lib/api';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Plus, Edit2, Trash2, Eye, 
  CheckCircle, XCircle, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuestionManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    niveau: '',
    category: '',
    question: '',
    description: '',
    points: 1,
    required: true,
    isConforme: true
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, tRes] = await Promise.all([
        API.get('/certification/questions'),
        API.get('/certification/templates')
      ]);
      setQuestions(qRes.data);
      setTemplates(tRes.data);
      if (tRes.data.length > 0 && !formData.niveau) {
        setFormData(prev => ({ ...prev, niveau: tRes.data[0].niveau }));
      }
    } catch (error) {
      console.error("Failed to load questions", error);
    } finally {
      setLoading(false);
    }
  }, [formData.niveau]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'ADMIN') {
        router.push('/formation');
      } else {
        fetchData();
      }
    }
  }, [authLoading, user, router, fetchData]);

  const handleOpenModal = (q = null) => {
    if (q) {
      setEditingQuestion(q);
      setFormData({
        niveau: q.template?.niveau || '',
        category: q.category || '',
        question: q.question || '',
        description: q.description || '',
        points: q.points || 1,
        required: q.required,
        isConforme: q.isConforme !== undefined ? q.isConforme : true
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        niveau: templates[0]?.niveau || '',
        category: '',
        question: '',
        description: '',
        points: 1,
        required: true,
        isConforme: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await API.put(`/certification/questions/${editingQuestion.id}`, formData);
      } else {
        await API.post('/certification/questions', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleToggleStatus = async (q) => {
    try {
      await API.patch(`/certification/questions/${q.id}/status`, { active: !q.active });
      fetchData();
    } catch (error) {
      alert("Erreur lors de la modification du statut");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await API.delete(`/certification/questions/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  // Derived unique categories for filter
  const categories = [...new Set(questions.map(q => q.category))].filter(Boolean);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (q.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiveau = filterNiveau === 'ALL' || q.template?.niveau === filterNiveau;
    const matchesStatus = filterStatus === 'ALL' ? true :
                          filterStatus === 'ACTIVE' ? q.active : !q.active;
    return matchesSearch && matchesNiveau && matchesStatus;
  });

  if (authLoading || loading) {
    return <div className="p-10 text-center">Chargement de la gestion des questions...</div>;
  }

  if (user?.role !== 'ADMIN') return null; // Fallback, router handles redirect

  return (
    <div className="max-w-[1400px] mx-auto p-4 pb-12 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/formation" className="p-2 bg-white border rounded-lg hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des questions</h1>
          <p className="text-gray-500 text-sm">Gérez le référentiel des questions pour les tests de certification</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-1">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <select 
              value={filterNiveau} 
              onChange={e => setFilterNiveau(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Niveau: Tous</option>
              {templates.map(t => <option key={t.niveau} value={t.niveau}>{t.niveau}</option>)}
            </select>

            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Statut: Tous</option>
              <option value="ACTIVE">Actives</option>
              <option value="INACTIVE">Inactives</option>
            </select>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-500 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une question
          </button>
        </div>

        {/* Question List */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium w-1/2">Question</th>
                <th className="px-4 py-4 font-medium">Niveau</th>
                <th className="px-4 py-4 font-medium">Réponse correcte</th>
                <th className="px-4 py-4 font-medium">Points</th>
                <th className="px-4 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuestions.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 whitespace-normal line-clamp-2" title={q.question}>{q.question}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{q.category}</span>
                      {!q.required && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded">Optionnel</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-700">
                    {q.template?.niveau}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      q.isConforme ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {q.isConforme ? 'CONFORME' : 'NON CONFORME'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {q.points} pt{q.points > 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      q.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {q.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => setPreviewQuestion(q)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Aperçu"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(q)}
                      className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition" title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(q)}
                      className={`p-1.5 rounded transition ${q.active ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-200' : 'text-green-600 hover:bg-green-50'}`} 
                      title={q.active ? "Désactiver" : "Activer"}
                    >
                      {q.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(q)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition" title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredQuestions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Aucune question trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d&apos;évaluation *</label>
                <select 
                  required
                  value={formData.niveau}
                  onChange={e => setFormData({...formData, niveau: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>Sélectionner le niveau</option>
                  {templates.map(t => <option key={t.niveau} value={t.niveau}>{t.niveau}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <input 
                  type="text" required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Sécurité, Électricité..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte de la question (Point de contrôle) *</label>
                <textarea 
                  required rows={3}
                  value={formData.question}
                  onChange={e => setFormData({...formData, question: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Ex: Vérifier que le disjoncteur est..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Consigne additionnelle</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Optionnel..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input 
                    type="number" required min="0"
                    value={formData.points}
                    onChange={e => setFormData({...formData, points: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.required}
                      onChange={e => setFormData({...formData, required: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Question requise (bloquante)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-3">Réponse correcte *</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.isConforme === true ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" name="isConforme" 
                      checked={formData.isConforme === true}
                      onChange={() => setFormData({...formData, isConforme: true})}
                      className="w-4 h-4 text-blue-600" 
                    />
                    <span className="font-bold text-gray-800">CONFORME</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.isConforme === false ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" name="isConforme" 
                      checked={formData.isConforme === false}
                      onChange={() => setFormData({...formData, isConforme: false})}
                      className="w-4 h-4 text-blue-600" 
                    />
                    <span className="font-bold text-gray-800">NON CONFORME</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  {editingQuestion ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Aperçu - Vue Technicien</h3>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">
                Mode Preview
              </span>
            </div>
            <div className="p-8 bg-white border-b">
              <div className="p-4 border rounded-xl shadow-sm bg-gray-50 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{previewQuestion.category}</span>
                  <div className="mt-1">
                    <p className="font-medium text-gray-800">1. {previewQuestion.question}</p>
                    {previewQuestion.description && <p className="text-sm text-gray-500 mt-1">{previewQuestion.description}</p>}
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      {previewQuestion.required ? `(${previewQuestion.points} pts)` : '(Non noté)'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="px-4 py-2 rounded-lg font-bold border transition bg-white text-gray-500 hover:border-green-600 hover:text-green-600">
                    Conforme
                  </button>
                  <button className="px-4 py-2 rounded-lg font-bold border transition bg-white text-gray-500 hover:border-red-600 hover:text-red-600">
                    Non Conforme
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium">
                <AlertTriangle className="w-5 h-5" />
                Visible uniquement par l&apos;ADMIN : 
              </div>
              <span className="font-bold text-sm bg-white px-3 py-1 rounded border shadow-sm text-gray-800">
                Bonne réponse : {previewQuestion.isConforme ? 'CONFORME' : 'NON CONFORME'}
              </span>
            </div>

            <div className="p-4 border-t flex justify-end bg-gray-50">
              <button onClick={() => setPreviewQuestion(null)} className="px-4 py-2 font-bold text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300">
                Fermer l&apos;aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <ShieldAlert className="w-8 h-8" />
                <h3 className="text-lg font-bold text-gray-900">Supprimer la question ?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer définitivement la question &quot;{deleteConfirm.question}&quot; ? 
                Cette action est irréversible (les anciens tests utilisant cette question ne seront pas affectés).
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Annuler
                </button>
                <button onClick={handleDelete} className="px-4 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
