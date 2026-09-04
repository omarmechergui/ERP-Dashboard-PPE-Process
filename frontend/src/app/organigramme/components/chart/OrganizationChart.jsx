import React, { useRef, useState, useEffect } from 'react';
import { OrganizationNode } from './OrganizationNode';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { EmptyState } from '../common/CommonStates';

export function OrganizationChart({ data, expandedNodes, onToggle, onNodeClick }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle Drag / Pan
  const handleMouseDown = (e) => {
    // Only drag if left click and not clicking on a card (cards have their own events)
    if (e.button !== 0 || e.target.closest('.group')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.001;
      setScale(s => Math.min(Math.max(0.2, s + zoomFactor), 2));
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  if (!data || data.length === 0) {
    return <EmptyState title="Aucun résultat" message="L'organigramme est vide avec les filtres actuels." />;
  }

  const handleZoomIn = () => setScale(s => Math.min(2, s + 0.1));
  const handleZoomOut = () => setScale(s => Math.max(0.2, s - 0.1));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[600px] lg:h-[800px] bg-[#f8fafc] rounded-xl border border-gray-200 overflow-hidden shadow-inner">
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 bg-white p-1 rounded-lg shadow-md border border-gray-200">
        <button onClick={handleZoomIn} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleResetZoom} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Reset View">
          <Maximize className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Chart Canvas */}
      <div 
        ref={containerRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="origin-top-center transition-transform duration-75 min-w-max flex justify-center py-10 px-20"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {data.map(rootNode => (
            <OrganizationNode 
              key={rootNode.id}
              node={rootNode}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
