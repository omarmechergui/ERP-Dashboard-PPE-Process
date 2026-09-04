/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react';
import API from '../../../lib/api';
import { UserAvatar } from './UserAvatar';
import { OrganizationChart } from '../../organigramme/components/chart/OrganizationChart';
import { buildTree } from '../../organigramme/utils/treeBuilder';
import { Users, AlertTriangle } from 'lucide-react';

export function OrganizationView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  useEffect(() => {
    fetchData();
  }, []);
  
  async function fetchData() {
    try {
      setLoading(true);
      const res = await API.get('/users/organization');
      const users = res.data;
      
      const tree = buildTree(users);
      setTreeData(tree);
      
      // Auto-expand all nodes for full visibility
      const initialExpanded = new Set();
      function expandAll(nodes) {
        nodes.forEach(node => {
          initialExpanded.add(node.id);
          if (node.children?.length) expandAll(node.children);
        });
      };
      expandAll(tree);
      setExpandedNodes(initialExpanded);
      
    } catch (err) {
      setError(err.message || "Erreur lors du chargement de l'organigramme");
    } finally {
      setLoading(false);
    }
  };

  function toggleNode(nodeId) {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Chargement de la structure organisationnelle...</div>;
  if (error) return (
    <div className="p-12 flex flex-col items-center justify-center text-center">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-2">Erreur de chargement</h3>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Réessayer</button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Vue Organisationnelle (En Direct)
        </h3>
        <p className="text-sm text-gray-500">Structure hiérarchique basée sur les affectations de managers actuelles.</p>
      </div>
      
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
        <OrganizationChart 
          data={treeData}
          expandedNodes={expandedNodes}
          onToggle={toggleNode}
          onNodeClick={() => {}} // No-op for now, could open user edit modal later
        />
      </div>
    </div>
  );
}
