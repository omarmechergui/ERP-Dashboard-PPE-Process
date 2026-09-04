/* eslint-disable react-hooks/immutability */
"use client";

import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { 
  Users, UserPlus, Search, Edit2, Trash2, 
  RefreshCcw, AlertTriangle, ShieldCheck, Mail, Save, X, Layout, History
} from 'lucide-react';
import { UserAvatar } from './components/UserAvatar';
import { OrganizationView } from './components/OrganizationView';
import { AuditLogViewer } from './components/AuditLogViewer';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PhotoUpload } from './components/PhotoUpload';
import { useAuth } from '../../lib/auth';

const VALID_ROLES = ['ADMIN', 'MANAGER', 'GL', 'TL', 'SUPERVISEUR', 'DESIGNER', 'TECHNICIEN', 'TECHNICIENSTOCK', 'OPERATEUR'];
const VALID_STATUTS = ['ACTIF', 'INACTIF'];

// ============================================================
// Hierarchy — mirrors backend/src/services/userHierarchy.js
// ============================================================
const VALID_MANAGER_ROLES = {
  ADMIN:          [],
  MANAGER:        [],
  GL:             ['MANAGER', 'ADMIN'],
  TL:             ['GL'],
  SUPERVISEUR:    ['TL'],
  DESIGNER:       ['TL'],
  TECHNICIEN:     ['SUPERVISEUR'],
  TECHNICIENSTOCK:['SUPERVISEUR'],
  OPERATEUR:      ['SUPERVISEUR'],
};

const ROLE_LABELS = {
  ADMIN: 'Administrateur', MANAGER: 'Manager', GL: 'Group Leader',
  TL: 'Team Leader', SUPERVISEUR: 'Superviseur', DESIGNER: 'Designer',
  TECHNICIEN: 'Technicien', TECHNICIENSTOCK: 'Tech. Stock', OPERATEUR: 'Opérateur',
};

export default function UtilisateursPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]); // GL & SUPERVISEUR for assignment
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // View State
  const [activeTab, setActiveTab] = useState('LIST'); // LIST, ORG, AUDIT
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form State
  const initialFormState = {
    matricule: '',
    email: '',
    nom: '',
    mot_de_passe: '',
    role: 'OPERATEUR',
    statut: 'ACTIF',
    managerId: '',
    phoneNumber: '',
    hireDate: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadUsers();
    loadManagers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await API.get('/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  async function loadManagers() {
    try {
      const response = await API.get('/users/team');
      setManagers(response.data);
    } catch (err) {
      console.error('Erreur chargement managers:', err);
    }
  };

  function handleOpenCreate() {
    setModalMode('CREATE');
    setFormData(initialFormState);
    setSelectedPhoto(null);
    setModalError('');
    setIsModalOpen(true);
  };

  function handleOpenEdit(user) {
    setModalMode('EDIT');
    setFormData({
      id: user.id,
      matricule: user.matricule,
      email: user.email,
      nom: user.nom,
      mot_de_passe: '', // Don't show password, leave blank unless changing
      role: user.role,
      statut: user.statut,
      managerId: user.managerId || '',
      photoUrl: user.photoUrl,
      phoneNumber: user.phoneNumber || '',
      hireDate: user.hireDate ? user.hireDate.split('T')[0] : ''
    });
    setSelectedPhoto(null);
    setModalError('');
    setIsModalOpen(true);
  };

  function handleCloseModal() {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setModalError('');
  };

  function confirmDelete(user) {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  async function handleDelete(id) {
    try {
      setIsSubmitting(true);
      await API.delete(`/users/${id}`);
      showSuccess("Utilisateur désactivé avec succès");
      setIsDeleteModalOpen(false);
      loadUsers();
    } catch (err) {
      setModalError(err.message || "Erreur lors de la suppression");
      alert(err.message || "Erreur lors de la suppression");
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      const payload = { ...formData };
      
      // Convert managerId to null if empty
      if (payload.managerId === '') {
        payload.managerId = null;
      }

      // Remove password if empty on edit
      if (modalMode === 'EDIT' && !payload.mot_de_passe) {
        delete payload.mot_de_passe;
      }

      let userId;

      if (modalMode === 'CREATE') {
        const res = await API.post('/users', payload);
        userId = res.data.id;
        showSuccess("Utilisateur créé avec succès");
      } else {
        userId = payload.id;
        await API.put(`/users/${userId}`, payload);
        showSuccess("Utilisateur modifié avec succès");
      }

      // Handle photo upload if a new one was selected during create
      if (modalMode === 'CREATE' && selectedPhoto instanceof File) {
        const photoForm = new FormData();
        photoForm.append('photo', selectedPhoto);
        await API.post(`/users/${userId}/photo`, photoForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      handleCloseModal();
      loadUsers();
      loadManagers();
    } catch (err) {
      console.error(err);
      setModalError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-bold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Gestion des Accès
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gérez les comptes, rôles et l&apos;organisation de l&apos;usine</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Nouvel Utilisateur
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('LIST')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'LIST' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Liste des Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('ORG')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'ORG' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          Organigramme
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'AUDIT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <History className="w-4 h-4" />
            Journal d&apos;Audit
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'LIST' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher (nom, email, matricule)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="GL">Group Leader</option>
                <option value="TL">Team Leader</option>
                <option value="SUPERVISEUR">Superviseur</option>
                <option value="DESIGNER">Designer</option>
                <option value="TECHNICIEN">Technicien</option>
                <option value="TECHNICIENSTOCK">Tech. Stock</option>
                <option value="OPERATEUR">Opérateur</option>
              </select>

              <button 
                onClick={loadUsers}
                disabled={loading}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-50"
                title="Rafraîchir"
              >
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date d&apos;embauche</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                  {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-400 font-medium">
                      Chargement des utilisateurs...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-400 font-medium">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    // Find manager details
                    const manager = u.managerId ? users.find(m => m.id === u.managerId) : null;
                    
                    return (
                      <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={u} size="md" />
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{u.nom}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                            {u.matricule}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border
                            ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                              u.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              u.role === 'GL' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                              u.role === 'TL' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 
                              u.role === 'SUPERVISEUR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                          {manager ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar user={manager} size="sm" />
                              {manager.nom}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Aucun</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {u.phoneNumber || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {u.hireDate ? new Date(u.hireDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                            ${u.statut === 'ACTIF' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-700 border-red-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            {u.statut}
                          </div>
                        </td>
                        
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenEdit(u)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => confirmDelete(u)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Désactiver"
                                disabled={u.id === currentUser?.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ORG' && (
        <div className="animate-in fade-in duration-300">
          <OrganizationView />
        </div>
      )}

      {activeTab === 'AUDIT' && isAdmin && (
        <div className="animate-in fade-in duration-300">
          <AuditLogViewer />
        </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {modalMode === 'CREATE' ? (
                  <><UserPlus className="w-5 h-5 text-blue-600" /> Nouvel Utilisateur</>
                ) : (
                  <><Edit2 className="w-5 h-5 text-blue-600" /> Modifier Utilisateur</>
                )}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              
              {modalError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{modalError}</p>
                </div>
              )}

              <form id="userForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <PhotoUpload 
                    userId={modalMode === 'EDIT' ? formData.id : null}
                    currentPhotoUrl={formData.photoUrl}
                    onUploadSuccess={(fileOrUrl) => {
                      if (modalMode === 'CREATE') {
                        setSelectedPhoto(fileOrUrl);
                      } else {
                        setFormData(prev => ({ ...prev, photoUrl: fileOrUrl }));
                        loadUsers(); // Refresh background list
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-2">Cliquez pour {formData.photoUrl ? 'modifier' : 'ajouter'} la photo (Optionnel)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Nom Complet *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        placeholder="Ex: Ahmed Kacem"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Matricule *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.matricule}
                        onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        placeholder="Ex: MAT-001"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        placeholder="Ex: ahmed@usine.tn"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Mot de passe {modalMode === 'CREATE' && '*'}
                      </label>
                      <input 
                        type="password" 
                        required={modalMode === 'CREATE'}
                        value={formData.mot_de_passe}
                        onChange={(e) => setFormData({...formData, mot_de_passe: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        placeholder={modalMode === 'EDIT' ? "Laisser vide pour ne pas modifier" : "••••••••"}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Numéro de téléphone</label>
                      <input 
                        type="tel" 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Date d&apos;embauche</label>
                      <input 
                        type="date" 
                        value={formData.hireDate}
                        onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Rôle *</label>
                      <select 
                        required
                        value={formData.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          // Reset managerId when role changes to avoid stale/invalid selections
                          setFormData({...formData, role: newRole, managerId: ''});
                        }}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      >
                        {VALID_ROLES.map(role => (
                          <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      {(() => {
                        const allowedManagerRoles = VALID_MANAGER_ROLES[formData.role] || [];
                        const isRootRole = allowedManagerRoles.length === 0;
                        const filteredManagers = managers.filter(m => 
                          m.id !== formData.id && allowedManagerRoles.includes(m.role)
                        );
                        
                        return (
                          <>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                              Responsable {isRootRole ? '' : '(Optionnel)'}
                            </label>
                            {isRootRole ? (
                              <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 italic">
                                Ce rôle n&apos;a pas de responsable hiérarchique.
                              </div>
                            ) : filteredManagers.length === 0 ? (
                              <div className="w-full px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                                Aucun {allowedManagerRoles.map(r => ROLE_LABELS[r]).join(' / ')} actif trouvé.
                              </div>
                            ) : (
                              <select 
                                value={formData.managerId}
                                onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                              >
                                <option value="">-- Aucun --</option>
                                {filteredManagers.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.nom} — {ROLE_LABELS[m.role] || m.role}
                                  </option>
                                ))}
                              </select>
                            )}
                            {!isRootRole && (
                              <p className="text-[11px] text-gray-500 mt-1">
                                Un {ROLE_LABELS[formData.role]} doit avoir un {allowedManagerRoles.map(r => ROLE_LABELS[r]).join(' ou ')} comme responsable.
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Statut *</label>
                      <select 
                        required
                        value={formData.statut}
                        onChange={(e) => setFormData({...formData, statut: e.target.value})}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 transition-all ${
                          formData.statut === 'ACTIF' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-100 focus:border-emerald-400' 
                            : 'bg-red-50 text-red-700 border-red-200 focus:ring-red-100 focus:border-red-400'
                        }`}
                      >
                        {VALID_STATUTS.map(statut => (
                          <option key={statut} value={statut}>{statut}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit"
                form="userForm"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-200 hover:shadow-md transition-all"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {modalMode === 'CREATE' ? 'Créer le compte' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        user={userToDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
