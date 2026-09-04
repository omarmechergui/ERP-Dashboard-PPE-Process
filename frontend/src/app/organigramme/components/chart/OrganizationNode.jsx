import React from 'react';
import { EmployeeCard } from '../EmployeeCard';

export function OrganizationNode({ 
  node, 
  expandedNodes, 
  onToggle, 
  onNodeClick,
  level = 0
}) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* The Node itself */}
      <EmployeeCard 
        employee={node}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        onToggle={onToggle}
        onClick={onNodeClick}
      />

      {/* Children container */}
      {isExpanded && hasChildren && (
        <div className="relative flex pt-8 mt-3">
          {/* Vertical line from parent to horizontal line */}
          <div className="absolute top-0 left-1/2 -ml-[1px] w-[2px] h-8 bg-gray-300"></div>

          {/* Horizontal line connecting children */}
          {node.children.length > 1 && (
            <div className="absolute top-8 left-[calc(50%/var(--child-count))] right-[calc(50%/var(--child-count))] h-[2px] bg-gray-300"
                 style={{ '--child-count': node.children.length }}>
            </div>
          )}

          {/* Render children */}
          <div className="flex gap-8 px-4 justify-center">
            {node.children.map((child, index) => (
              <div key={child.id} className="relative flex flex-col items-center pt-8">
                {/* Vertical line from horizontal line to child */}
                <div className="absolute top-0 left-1/2 -ml-[1px] w-[2px] h-8 bg-gray-300"></div>
                <OrganizationNode 
                  node={child}
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                  onNodeClick={onNodeClick}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
