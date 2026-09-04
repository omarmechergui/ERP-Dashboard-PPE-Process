/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertOctagon, X } from 'lucide-react';

export function ActionAlert({ type, message, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for transition
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-emerald-200' : 'border-red-200';
  const textColor = isSuccess ? 'text-emerald-800' : 'text-red-800';
  const Icon = isSuccess ? CheckCircle : AlertOctagon;
  const iconColor = isSuccess ? 'text-emerald-500' : 'text-red-500';

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg max-w-md ${bgColor} ${borderColor}`}>
        <Icon className={`w-6 h-6 flex-shrink-0 ${iconColor}`} />
        <p className={`text-sm font-medium ${textColor} flex-1`}>{message}</p>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${textColor}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
