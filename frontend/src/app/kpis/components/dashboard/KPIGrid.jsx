import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Activity, ShieldCheck, Target, 
  Wrench, AlertTriangle, Cpu, DollarSign 
} from 'lucide-react';
import KPICard from '../common/KPICard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export default function KPIGrid({ kpis, trends }) {
  if (!kpis) return null;

  const cards = [
    {
      id: 'mttr',
      title: 'MTTR (Moyen réparation)',
      value: kpis.mttr,
      icon: Clock,
      trend: trends?.mttr,
      theme: 'blue',
      invertedTrend: true, // Lower is better
      tooltip: 'Mean Time To Repair (Temps moyen de réparation)'
    },
    {
      id: 'mtbf',
      title: 'MTBF (Moyen pannes)',
      value: kpis.mtbf,
      icon: Activity,
      trend: trends?.mtbf,
      theme: 'green',
      tooltip: 'Mean Time Between Failures (Temps moyen entre pannes)'
    },
    {
      id: 'availability',
      title: 'Taux Disponibilité',
      value: kpis.availability,
      icon: ShieldCheck,
      trend: trends?.availability,
      theme: 'orange',
      tooltip: 'Taux de disponibilité opérationnelle globale'
    },
    {
      id: 'oee',
      title: 'OEE / TRS',
      value: kpis.oee,
      icon: Target,
      trend: trends?.oee,
      theme: 'blue',
      tooltip: 'Overall Equipment Effectiveness (Taux de Rendement Synthétique)'
    },
    {
      id: 'preventiveRatio',
      title: 'Ratio Préventif',
      value: kpis.preventiveRatio,
      icon: Wrench,
      trend: trends?.preventiveRatio,
      theme: 'green',
      tooltip: 'Pourcentage de maintenance préventive vs curative'
    },
    {
      id: 'criticalFailures',
      title: 'Pannes Critiques',
      value: kpis.criticalFailures,
      icon: AlertTriangle,
      trend: trends?.criticalFailures,
      theme: 'red',
      invertedTrend: true, // Lower is better
      tooltip: 'Nombre de défaillances critiques actives ou récentes'
    },
    {
      id: 'machineAvailability',
      title: 'Machines Actives',
      value: kpis.machineAvailability,
      icon: Cpu,
      trend: trends?.machineAvailability,
      theme: 'orange',
      tooltip: 'Nombre de machines en ligne par rapport au total'
    },
    {
      id: 'maintenanceCost',
      title: 'Coût Maintenance',
      value: kpis.maintenanceCost,
      icon: DollarSign,
      trend: trends?.maintenanceCost,
      theme: 'red',
      invertedTrend: true, // Lower is better
      tooltip: 'Coût estimé des pièces et interventions sur la période'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {cards.map((card, index) => (
        <KPICard
          key={card.id}
          title={card.title}
          value={card.value}
          icon={card.icon}
          trend={card.trend}
          theme={card.theme}
          invertedTrend={card.invertedTrend}
          tooltip={card.tooltip}
          delay={index * 0.05}
        />
      ))}
    </motion.div>
  );
}
