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
  getArticlesByIds,
  activateArticle
} = require('../controllers/stockController');
const { protect, requirePermission } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(requirePermission('STOCK_VIEW'));

// Articles Reading
router.get('/articles/search', searchArticlesLight);
router.post('/articles/by-ids', getArticlesByIds);
router.get('/articles', getArticles);
router.get('/articles/:id', getArticleById);
router.get('/articles/:id/consumption', getArticleConsumption);

// Articles Mutation
router.post('/articles', requirePermission('STOCK_CREATE'), createArticle);
router.put('/articles/:id', requirePermission('STOCK_EDIT'), updateArticle);
router.delete('/articles/:id', requirePermission('STOCK_DELETE'), deleteArticle);
router.patch('/articles/:id/activate', requirePermission('STOCK_DELETE'), activateArticle);

// Movements
router.post('/entrees', requirePermission('STOCK_MOVEMENT_MANAGE'), stockEntree);
router.post('/sorties', requirePermission('STOCK_MOVEMENT_MANAGE'), stockSortie);
router.post('/sorties/bulk', requirePermission('STOCK_MOVEMENT_MANAGE'), stockSortieBulk);
router.get('/mouvements', getMouvements);
router.get('/mouvements/stats', getMovementStats);
router.get('/export', requirePermission('STOCK_EXPORT'), exportStock);
router.post('/import', requirePermission('STOCK_IMPORT'), importStockMovements);
router.post('/import/batch', requirePermission('STOCK_IMPORT'), importStockBatch);

module.exports = router;
