const prisma = require('../config/db');

const getSharedMaintenanceKpis = async () => {
  const totalInterventions = await prisma.intervention.count();
  
  const completedInterventions = await prisma.intervention.count({
    where: { status: { in: ['Clôturée', 'TERMINÉE'] } }
  });
  
  const inProgressInterventions = await prisma.intervention.count({
    where: { status: { in: ['En cours', 'EN_COURS'] } }
  });

  const openInterventions = await prisma.intervention.count({
    where: { status: { in: ['En attente', 'PLANIFIÉE'] } }
  });

  // Preventive Ratio
  const preventiveInterventions = await prisma.intervention.count({
    where: { type: { in: ['Préventive', 'PREVENTIVE'] } }
  });
  const preventiveRatio = totalInterventions > 0 ? ((preventiveInterventions / totalInterventions) * 100).toFixed(1) : 0;

  // Calculate MTTR in hours
  const completedWithTime = await prisma.intervention.findMany({
    where: { 
      status: { in: ['Clôturée', 'TERMINÉE'] },
      downtime: { not: null }
    }
  });

  let mttr = null;
  if (completedWithTime.length > 0) {
    const totalDowntime = completedWithTime.reduce((sum, curr) => sum + curr.downtime, 0);
    mttr = (totalDowntime / completedWithTime.length).toFixed(2);
  } else {
    mttr = "N/A";
  }

  // MTTR Data per month (last 6 months)
  const mttrDataLabels = [];
  const mttrDataValues = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    mttrDataLabels.push(monthStr);

    const monthInterventions = completedWithTime.filter(int => {
      const intDate = new Date(int.endDate || int.actualEnd || int.updatedAt);
      return intDate.getMonth() === d.getMonth() && intDate.getFullYear() === d.getFullYear();
    });

    let monthMttr = 0;
    if (monthInterventions.length > 0) {
      monthMttr = monthInterventions.reduce((sum, curr) => sum + curr.downtime, 0) / monthInterventions.length;
    }
    mttrDataValues.push(parseFloat(monthMttr.toFixed(2)));
  }

  // ABC Data (Priority distribution)
  const priorityCounts = await prisma.intervention.groupBy({
    by: ['priority'],
    _count: { priority: true }
  });

  const abcMap = { 'Critique': 0, 'Urgent': 0, 'Haute': 0, 'Normal': 0, 'Basse': 0 };
  priorityCounts.forEach(p => {
    if (abcMap[p.priority] !== undefined) {
      abcMap[p.priority] = p._count.priority;
    } else {
      abcMap['Normal'] += p._count.priority;
    }
  });

  const abcDataValues = [abcMap['Critique'] + abcMap['Urgent'], abcMap['Haute'], abcMap['Normal'] + abcMap['Basse']];

  // Trends logic (Current month vs Previous month)
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const previousMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

  const currMonthTotal = await prisma.intervention.count({ where: { createdAt: { gte: currentMonthStart } } });
  const prevMonthTotal = await prisma.intervention.count({ where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } } });
  const totalTrend = prevMonthTotal > 0 ? (((currMonthTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1) : (currMonthTotal > 0 ? 100 : 0);

  const currMonthCompleted = await prisma.intervention.count({ where: { status: { in: ['Clôturée', 'TERMINÉE'] }, createdAt: { gte: currentMonthStart } } });
  const prevMonthCompleted = await prisma.intervention.count({ where: { status: { in: ['Clôturée', 'TERMINÉE'] }, createdAt: { gte: previousMonthStart, lt: currentMonthStart } } });
  const completedTrend = prevMonthCompleted > 0 ? (((currMonthCompleted - prevMonthCompleted) / prevMonthCompleted) * 100).toFixed(1) : (currMonthCompleted > 0 ? 100 : 0);


  // Heatmap Data (from actual Interventions)
  const allInterventions = await prisma.intervention.findMany({
    select: { createdAt: true }
  });

  const heatmapCounts = Array.from({ length: 7 }, () => Array(24).fill(0));

  allInterventions.forEach(int => {
    const d = new Date(int.createdAt);
    const day = d.getDay(); 
    const hour = d.getHours(); 
    heatmapCounts[day][hour]++;
  });

  const heatmapData = [];
  const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      heatmapData.push({
        day: daysMap[d],
        hour: h,
        count: heatmapCounts[d][h]
      });
    }
  }

  // Calculate Best-Effort MTBF based on time between failures per machine
  const allCorrective = await prisma.intervention.findMany({
    where: { type: 'Corrective', machineId: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: { machineId: true, createdAt: true }
  });

  let totalMtbfHours = 0;
  let mtbfIntervalCount = 0;

  const machineLastFailure = {};
  allCorrective.forEach(int => {
    if (machineLastFailure[int.machineId]) {
      const diffHours = (new Date(int.createdAt) - new Date(machineLastFailure[int.machineId])) / (1000 * 60 * 60);
      if (diffHours > 0) {
        totalMtbfHours += diffHours;
        mtbfIntervalCount++;
      }
    }
    machineLastFailure[int.machineId] = int.createdAt;
  });

  const mtbf = mtbfIntervalCount > 0 ? (totalMtbfHours / mtbfIntervalCount).toFixed(1) : "N/A";
  const disponibilite = null; // Still needs operational hours to compute accurately

  const interventionsMois = currMonthTotal;

  return {
    totalInterventions,
    completedInterventions,
    inProgressInterventions,
    openInterventions,
    preventiveRatio,
    mttr,
    mtbf,
    disponibilite,
    interventionsMois,
    mttrData: {
      labels: mttrDataLabels,
      datasets: [
        { label: 'MTTR (h)', data: mttrDataValues, backgroundColor: '#3b82f6' }
      ]
    },
    abcData: {
      labels: ['Critique/Urgent', 'Haute', 'Normal/Basse'],
      datasets: [
        { data: abcDataValues, backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'], borderWidth: 0 }
      ]
    },
    heatmapData,
    trends: {
      totalInterventions: parseFloat(totalTrend),
      completedInterventions: parseFloat(completedTrend)
    }
  };
};

module.exports = {
  getSharedMaintenanceKpis
};
