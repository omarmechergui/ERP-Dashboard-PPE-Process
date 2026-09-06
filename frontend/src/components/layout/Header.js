'use client';

import React from 'react';
import { useAuth } from '../../lib/auth';
import { User, Bell } from 'lucide-react';

const roleDisplay = {
  ADMIN: { label: 'Admin', class: 'bg-danger/10 text-danger border-danger/20' },
  GL: { label: 'Gestionnaire Logistique', class: 'bg-info/10 text-info border-info/20' },
  SUPERVISEUR: { label: 'Superviseur', class: 'bg-warning/10 text-warning border-warning/20' },
  OPERATEUR: { label: 'Opérateur', class: 'bg-secondary text-secondary-foreground border-border' },
};

export default function Header() {
  const { user } = useAuth();

  if (!user) return null;

  const userRole = roleDisplay[user.role] || { label: user.role, class: 'bg-secondary text-secondary-foreground border-border' };

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
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 md:px-8 sticky top-0 z-20 shadow-sm w-full">
      {/* Title Placeholder / Page Context */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">MES Terminal</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-6">
        {/* Notifications mock icon */}
        <button className="relative text-secondary-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-secondary">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
        </button>

        {/* User profile dropdown info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{user.nom}</p>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              <span className="text-xs text-muted">#{user.matricule}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${userRole.class}`}>
                {userRole.label}
              </span>
            </div>
          </div>

          {/* User Avatar */}
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shadow-inner">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
