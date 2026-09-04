const express = require('express');
const { getKpis, getAvancementProjets, getMouvementsStockStats, getMaintenanceKpis, getInterventions, getTechniciens } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/kpis', getKpis);
router.get('/avancement-projets', getAvancementProjets);
router.get('/mouvements-stock', getMouvementsStockStats);
router.get('/maintenance-kpis', getMaintenanceKpis);
router.get('/interventions', getInterventions);

router.get('/techniciens', getTechniciens);

module.exports = router;
