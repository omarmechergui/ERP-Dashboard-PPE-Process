import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ 
  columns, 
  data, 
  loading, 
  onRowClick, 
  pagination, 
  onPageChange,
  emptyMessage = "Aucune donnée disponible"
}) {
  if (loading) {
    return (
      <div className="w-full bg-card rounded-xl border border-border overflow-hidden shadow-sm animate-pulse">
        <div className="h-12 bg-secondary border-b border-border"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-border flex items-center px-6 gap-4">
             <div className="h-4 bg-secondary rounded w-1/4"></div>
             <div className="h-4 bg-secondary rounded w-1/4"></div>
             <div className="h-4 bg-secondary rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] whitespace-nowrap">
          <thead className="bg-secondary/50 text-secondary-foreground font-semibold border-b border-border">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-6 py-3.5 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground font-medium">
            {data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-secondary/30' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      {col.cell ? col.cell(row) : row[col.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-secondary-foreground font-medium">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/20">
          <span className="text-sm text-secondary-foreground font-medium">
            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} éléments
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg border border-border bg-card text-secondary-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
              className="p-1.5 rounded-lg border border-border bg-card text-secondary-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
