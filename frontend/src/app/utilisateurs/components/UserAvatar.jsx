import React from 'react';
import { User } from 'lucide-react';
import Image from 'next/image';

export function UserAvatar({ user, size = 'md', className = '' }) {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  if (!user) return <div className={`bg-gray-200 rounded-full flex items-center justify-center text-gray-500 ${sizeClasses[size]} ${className}`}><User className="w-1/2 h-1/2" /></div>;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getColors = (name) => {
    if (!name) return 'bg-gray-200 text-gray-700';
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-violet-100 text-violet-700 border-violet-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold border ${sizeClasses[size]} ${!user.photoUrl || imgError ? getColors(user.nom) : 'border-gray-200'} ${className}`}>
      {user.photoUrl && !imgError ? (
        <Image
          src={user.photoUrl.startsWith('http') ? user.photoUrl : `${API_URL}${user.photoUrl}`} 
          alt={user.nom || 'Avatar'}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{getInitials(user.nom)}</span>
      )}
      
      {/* Optional Status Indicator */}
      {user.statut && size !== 'sm' && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
          user.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-red-500'
        }`}></span>
      )}
    </div>
  );
}
