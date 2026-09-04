const express = require('express');
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  stockEntree,
  stockSortie,
  stockSortieBulk,
  getMouvements,
  getMovementStats,
  getArticleConsumption,
  exportStock,
  importStockMovements,
  importStockBatch,
  searchArticlesLight,
  getArticlesByIds
} = require('../controllers/stockController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

router.use(protect);

// Articles Reading (All roles)
router.get('/articles/search', searchArticlesLight);
router.post('/articles/by-ids', getArticlesByIds);
router.get('/articles', getArticles);
router.get('/articles/:id', getArticleById);
router.get('/articles/:id/consumption', getArticleConsumption);

// Articles Mutation (GL & Admin)
router.post('/articles', requireRole(['GL', 'ADMIN']), createArticle);
router.put('/articles/:id', requireRole(['GL', 'ADMIN']), updateArticle);
router.delete('/articles/:id', requireRole(['GL', 'ADMIN']), deleteArticle);

// Movements (Operator, GL, Admin)
router.post('/entrees', requireRole(['OPERATEUR', 'GL', 'ADMIN']), stockEntree);
router.post('/sorties', requireRole(['OPERATEUR', 'GL', 'ADMIN']), stockSortie);
router.post('/sorties/bulk', requireRole(['OPERATEUR', 'GL', 'ADMIN']), stockSortieBulk);
router.get('/mouvements', getMouvements);
router.get('/mouvements/stats', getMovementStats);
router.get('/export', exportStock);
router.post('/import', requireRole(['OPERATEUR', 'GL', 'ADMIN']), importStockMovements);
router.post('/import/batch', requireRole(['OPERATEUR', 'GL', 'ADMIN']), importStockBatch);

module.exports = router;
