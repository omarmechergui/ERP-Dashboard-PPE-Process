"use client";

import React from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import PanneauCard from "./PanneauCard";

const DroppableColumn = ({ col, colPanneaux, colPanneauxIds, isWriteAllowed, onHistoryClick, onEdit, onDelete, onView, loadingPanneauId }) => {
  const { setNodeRef } = useDroppable({
    id: col.id,
  });

  return (
    <div className={`flex flex-col rounded-2xl border ${col.color} overflow-hidden shadow-sm h-full`}>
      <div className="p-4 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{col.title}</h3>
        <span className="bg-slate-200/70 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold shadow-inner">
          {colPanneaux.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto space-y-3 relative min-h-[150px]">
        <SortableContext items={colPanneauxIds} strategy={verticalListSortingStrategy}>
          {colPanneaux.map(p => (
            <PanneauCard 
              key={p.id} 
              panneau={p} 
              isWriteAllowed={isWriteAllowed}
              onHistoryClick={onHistoryClick}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              isLoading={loadingPanneauId === p.id}
            />
          ))}
        </SortableContext>
        
        {colPanneaux.length === 0 && (
          <div className="absolute inset-4 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl opacity-50 pointer-events-none">
            <span className="text-sm font-medium text-slate-400 text-center">Glissez un panneau ici</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function KanbanBoard({ 
  panneaux, 
  onDragEnd, 
  isWriteAllowed,
  onHistoryClick,
  onEdit,
  onDelete,
  onView,
  loadingPanneauId
}) {
  const columns = [
    { id: 'EN_CONSTRUCTION', title: 'En construction', color: 'border-blue-200 bg-blue-50/50 header-blue' },
    { id: 'EN_VALIDATION', title: 'En validation', color: 'border-amber-200 bg-amber-50/50 header-amber' },
    { id: 'KHM', title: 'KHM', color: 'border-purple-200 bg-purple-50/50 header-purple' },
    { id: 'TERMINE', title: 'Terminé', color: 'border-emerald-200 bg-emerald-50/50 header-emerald' },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-16rem)] min-h-[600px]">
        {columns.map((col) => {
          const colPanneaux = panneaux.filter(p => p.etat_construction === col.id);
          const colPanneauxIds = colPanneaux.map(p => p.id);

          return (
            <DroppableColumn 
              key={col.id}
              col={col}
              colPanneaux={colPanneaux}
              colPanneauxIds={colPanneauxIds}
              isWriteAllowed={isWriteAllowed}
              onHistoryClick={onHistoryClick}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              loadingPanneauId={loadingPanneauId}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
