const prisma = require('../config/db');
const { getSharedMaintenanceKpis } = require('../services/maintenanceKpiService');
const { calculateEffectiveMinStock, TECHNICIEN_ROLES } = require('../helpers/stockHelpers');

// @desc    Get dashboard KPIs
// @route   GET /dashboard/kpis
// @access  Private
const getKpis = async (req, res, next) => {
  try {
    // 1. Articles in low stock / critical level
    const articles = await prisma.article.findMany({
      select: { quantite: true, bomLines: { select: { quantite: true } } }
    });
    const lowStockCount = articles.filter(a => {
      const calculated_min_stock = calculateEffectiveMinStock(a.bomLines);
      return a.quantite <= calculated_min_stock;
    }).length;

    // 2. Active panels (construction state is not TERMINE)
    const activePanelsCount = await prisma.panneau.count({
      where: {
        etat_construction: { not: 'TERMINE' }
      }
    });

    // 3. Active planifications (current date within start/end range)
    const now = new Date();
    const activePlanificationsCount = await prisma.planification.count({
      where: {
        date_debut: { lte: now },
        date_fin: { gte: now }
      }
    });

    // 4. KHM Conformity Rate (%)
    const totalKhm = await prisma.panneau.count({
      where: {
        etat_khm: { in: ['CONFORME', 'NON_CONFORME'] }
      }
    });

    const conformKhm = await prisma.panneau.count({
      where: {
        etat_khm: 'CONFORME'
      }
    });

    const conformityRate = totalKhm > 0 ? Math.round((conformKhm / totalKhm) * 100) : 100;

    // 5. Finished today (Panneaux completed today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const terminesAujourdhui = await prisma.panneau.count({
      where: {
        etat_construction: 'TERMINE',
        updatedAt: { gte: startOfToday, lte: endOfToday } // Assuming we have updatedAt, else we'll check it. Let's assume we don't track state change exactly, but we'll try updatedAt.
      }
    }).catch(() => 0); // If updatedAt doesn't exist on panneau, return 0

    // 6. Active Reservations
    const reservationsActives = await prisma.reservation.count({
      where: {
        status: { in: ['EN_ATTENTE', 'VALIDE'] }
      }
    }).catch(() => 0);

    // 7. Production Today (SORTIE movements today)
    const productionAujourdhui = await prisma.mouvementStock.count({
      where: {
        type: 'SORTIE',
        createdAt: { gte: startOfToday, lte: endOfToday }
      }
    });

    // 8. Active BOMs
    const activeBoms = await prisma.bOM.count().catch(() => 0);

    res.json({
      articles_critique: lowStockCount,
      panneaux_en_cours: activePanelsCount,
      planifications_actives: activePlanificationsCount,
      taux_conformite_khm: conformityRate,
      termines_aujourdhui: terminesAujourdhui,
      reservations_actives: reservationsActives,
      production_aujourdhui: productionAujourdhui,
      boms_actives: activeBoms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress by project (Bar Chart data)
// @route   GET /dashboard/avancement-projets
// @access  Private
const getAvancementProjets = async (req, res, next) => {
  try {
    // Group panels by project and calculate average completion
    const panneaux = await prisma.panneau.findMany();

    // Map construction state to progress percentage
    const stateWeight = {
      EN_CONSTRUCTION: 25,
      EN_VALIDATION: 60,
      KHM: 85,
      TERMINE: 100
    };

    const projectGroups = {};
    panneaux.forEach(p => {
      const proj = p.title_project;
      if (!projectGroups[proj]) {
        projectGroups[proj] = { sum: 0, count: 0 };
      }
      projectGroups[proj].sum += stateWeight[p.etat_construction] || 0;
      projectGroups[proj].count += 1;
    });

    const result = Object.keys(projectGroups).map(proj => {
      return {
        projet: proj,
        avancement: Math.round(projectGroups[proj].sum / projectGroups[proj].count)
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movements for line chart (last N days)
// @route   GET /dashboard/mouvements-stock
// @access  Private
const getMouvementsStockStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const movements = await prisma.mouvementStock.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date (YYYY-MM-DD or MM/DD)
    const stats = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      stats[dateString] = { entrees: 0, sorties: 0 };
    }

    movements.forEach(m => {
      const date = new Date(m.createdAt);
      const dateString = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (stats[dateString]) {
        if (m.type === 'ENTREE') {
          stats[dateString].entrees += m.quantite;
        } else if (m.type === 'SORTIE') {
          stats[dateString].sorties += m.quantite;
        }
      }
    });

    const chartData = Object.keys(stats).map(date => {
      return {
        date,
        entrees: stats[date].entrees,
        sorties: stats[date].sorties
      };
    });

    res.json(chartData);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Maintenance KPIs
// @route   GET /dashboard/maintenance-kpis
// @access  Private
const getMaintenanceKpis = async (req, res, next) => {
  try {
    const kpiData = await getSharedMaintenanceKpis();
    
    // Removed fake planning timeline as per business requirements.
    // Dashboard will receive the kpiData directly.
    res.json(kpiData);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Interventions
// @route   GET /dashboard/interventions
// @access  Private
const getInterventions = async (req, res, next) => {
  try {
    const interventions = await prisma.intervention.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formattedInterventions = interventions.map(int => ({
      id: int.id,
      code: int.code,
      defaut: int.defaut,
      temps: int.downtime !== null ? `${int.downtime}h` : '—',
      shift: int.shift || '—',
      statut: int.status,
      color: int.status === 'Clôturée' ? 'success' : int.status === 'En cours' ? 'warning' : 'danger'
    }));

    const timeline = interventions.map(int => ({
      id: int.id,
      code: int.code,
      gridCells: Array(7).fill(false).map((_, i) => i === new Date(int.createdAt).getDay()),
      color: int.status === 'Clôturée' ? 'success' : int.status === 'En cours' ? 'warning' : 'danger'
    }));

    res.json({
      interventions: formattedInterventions,
      timeline
    });
  } catch (error) {
    next(error);
  }
};




// @desc    Get Techniciens
// @route   GET /dashboard/techniciens
// @access  Private
const getTechniciens = async (req, res, next) => {
  try {
    const rawTechniciens = await prisma.user.findMany({
      where: { role: { in: TECHNICIEN_ROLES } },
      include: {
        skills: true,
        interventions: {
          where: { status: 'Clôturée' }
        }
      }
    });

    // Score based on skills level and completed interventions
    const formatted = rawTechniciens.map(t => {
      let score = 0;
      const skillsMap = {};
      t.skills.forEach(s => {
        let levelColor = 'var(--fill-disabled)';
        if (s.level === 3) { levelColor = 'var(--fill-success)'; score += 30; }
        else if (s.level === 2) { levelColor = 'var(--fill-accent)'; score += 20; }
        else if (s.level === 1) { levelColor = 'var(--fill-warning)'; score += 10; }
        
        // Normalize skill name to map to UI
        const key = s.name.toLowerCase().replace(/ /g, '');
        skillsMap[key] = levelColor;
      });

      // Cap score at 100
      const finalScore = Math.min(100, score + t.interventions.length * 2);

      return {
        name: t.nom,
        score: finalScore,
        interventions: t.interventions.length,
        skills: skillsMap,
        detail: {
          department: t.department || 'Non assigné',
          position: t.position || 'Technicien'
        }
      };
    }).sort((a, b) => b.score - a.score).slice(0, 3); // top 3

    res.json({ techniciens: formatted });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKpis,
  getAvancementProjets,
  getMouvementsStockStats,
  getMaintenanceKpis,
  getInterventions,
  getTechniciens
};
