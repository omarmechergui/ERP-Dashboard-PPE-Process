'use client';

import React from 'react';
import { useAuth } from '../../lib/auth';
import { User, Bell } from 'lucide-react';

const roleDisplay = {
  ADMIN: { label: 'Admin', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
  GL: { label: 'Gestionnaire Logistique', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  SUPERVISEUR: { label: 'Superviseur', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  OPERATEUR: { label: 'Opérateur', class: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export default function Header() {
  const { user } = useAuth();

  if (!user) return null;

  const userRole = roleDisplay[user.role] || { label: user.role, class: 'bg-slate-50 text-slate-600 border-slate-200' };

  // Initials for avatar
  const initials = user.nom
    ? user.nom
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'US';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-20 shadow-sm">      {/* Title Placeholder / Page Context */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">MES Terminal</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-6">
        {/* Notifications mock icon */}
        <button className="relative text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
        </button>

        {/* User profile dropdown info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user.nom}</p>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-xs text-slate-500">#{user.matricule}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${userRole.class}`}>
                {userRole.label}
              </span>
            </div>
          </div>

          {/* User Avatar */}
          <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600 shadow-inner">            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
