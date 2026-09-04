import React from 'react';
import { PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 p-10 h-full min-h-[400px]">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="bg-slate-50 p-6 rounded-full border border-slate-100"
      >
        <PackageOpen className="h-16 w-16 text-slate-300" />
      </motion.div>
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center space-y-1"
      >
        <h4 className="text-lg font-bold text-slate-700">Aucune nomenclature sélectionnée</h4>
        <p className="text-sm text-slate-400 max-w-sm">
          Sélectionnez une nomenclature dans le panneau de gauche ou créez-en une nouvelle pour visualiser et gérer ses composants.
        </p>
      </motion.div>
    </div>
  );
}
