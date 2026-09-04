import React from 'react';
import { Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { UserAvatar } from '@/app/utilisateurs/components/UserAvatar';

export function EmployeeCard({ employee, isExpanded, hasChildren, onToggle, onClick }) {
  // Department Colors
  const getDeptColor = (dept) => {
    switch (dept?.toLowerCase()) {
      case 'direction': return 'bg-blue-500';
      case 'production': return 'bg-green-500';
      case 'maintenance': return 'bg-orange-500';
      case 'quality': case 'qualité': return 'bg-purple-500';
      case 'stock': return 'bg-cyan-500';
      case 'hr': case 'ressources humaines': return 'bg-pink-500';
      default: return 'bg-slate-500';
    }
  };

  // Status Badge
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'actif': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'inactive': case 'inactif': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'vacation': case 'en congé': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'suspended': case 'suspendu': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative group flex flex-col items-center">
      <div 
        onClick={() => onClick(employee)}
        className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden z-10"
      >
        {/* Top border colored by department */}
        <div className={`h-1.5 w-full ${getDeptColor(employee.department)}`}></div>
        
        <div className="p-4 flex flex-col items-center text-center">
          <div className="relative mb-3 flex justify-center">
            <UserAvatar 
              user={employee} 
              size="lg" 
              className="border-2 border-white shadow-sm"
            />
          </div>

          <h4 className="text-base font-bold text-gray-900 leading-tight">
            {employee.firstName} {employee.lastName}
          </h4>
          <p className="text-sm font-medium text-blue-600 mt-1">{employee.role}</p>
          <p className="text-xs text-gray-500 mt-0.5">{employee.department}</p>
          
          <div className="flex gap-2 mt-3">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${getStatusColor(employee.status)}`}>
              {employee.status}
            </span>
          </div>
        </div>

        {/* Action / Contact Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
          <div className="flex gap-2 text-gray-400 group-hover:text-blue-500 transition-colors">
            {employee.email && <Mail className="w-3.5 h-3.5" title={employee.email} />}
            {employee.phone && <Phone className="w-3.5 h-3.5" title={employee.phone} />}
          </div>
          {hasChildren && (
            <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
              {employee.children?.length || 0}
            </span>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(employee.id);
          }}
          className="absolute -bottom-3 z-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 shadow-sm transition-all focus:outline-none"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
