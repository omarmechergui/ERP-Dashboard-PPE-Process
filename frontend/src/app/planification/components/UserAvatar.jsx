import React from 'react';

export default function UserAvatar({ user, label }) {
  if (!user || !user.nom) return null;

  // Extract initials (up to 2 characters)
  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user.nom);
  
  // Determine role based color if possible, else standard slate
  // We can use a subtle background with glowing text or border
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
        <span className="text-xs font-bold text-slate-700 tracking-wider">
          {initials}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-slate-800 truncate leading-tight">
          {user.nom}
        </span>
        <span className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}
