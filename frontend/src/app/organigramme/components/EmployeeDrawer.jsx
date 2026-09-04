import React from 'react';
import { X, Mail, Phone, Calendar, Briefcase, Network, Shield, AlertTriangle } from 'lucide-react';
import { UserAvatar } from '@/app/utilisateurs/components/UserAvatar';

export function EmployeeDrawer({ isOpen, onClose, employee }) {
  if (!isOpen || !employee) return null;

  const calculateAnciennete = (hireDate) => {
    if (!hireDate) return '—';
    const start = new Date(hireDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    const parts = [];
    if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mois`);
    return parts.length > 0 ? parts.join(', ') : "Moins d'un mois";
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col h-full border-l border-gray-200`}>
        
        {/* Header */}
        <div className="flex-none p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Détails du Collaborateur</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <UserAvatar 
              user={employee} 
              size="xl" 
              className="border-4 border-white shadow-md mb-4"
            />
            <h3 className="text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h3>
            <p className="text-lg text-blue-600 font-medium mt-1">{employee.role}</p>
            <span className={`mt-3 px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${
              employee.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {employee.status}
            </span>
          </div>

          {/* Contact Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Coordonnées</h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <span className="truncate select-all">{employee.email || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <span className="select-all">{employee.phoneNumber || 'Non renseigné'}</span>
            </div>
          </section>

          {/* Organization Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Informations professionnelles</h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Département</p>
                <p>{employee.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Network className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Position</p>
                <p>{employee.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Date d&apos;embauche</p>
                <p>{employee.hireDate ? new Intl.DateTimeFormat('fr-FR').format(new Date(employee.hireDate)) : 'Non renseignée'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Ancienneté</p>
                <p className="font-semibold text-indigo-700">{calculateAnciennete(employee.hireDate)}</p>
              </div>
            </div>
          </section>
          
          {/* Hierarchy Stats */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Hiérarchie</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase">N+1</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{employee.managerId ? 'Oui' : 'PDG'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase">Subordonnés</p>
                <p className="text-sm font-bold text-blue-600 mt-1">{employee.children?.length || 0}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex-none p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            Message
          </button>
          <button className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center gap-2">
             Voir le profil complet
          </button>
        </div>
      </div>
    </>
  );
}
