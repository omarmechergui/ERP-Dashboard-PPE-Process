const express = require('express');
const { protect, requireRole } = require('../middlewares/auth');
const {
  getDashboardInfo,
  getTechniciensList,
  getTechnicienDetails,
  getTemplates,
  importTemplates,
  scheduleTest,
  getTestDetails,
  submitTest,
  getBadge,
  deleteTest,
  deleteBadge,
  deleteTemplate,
  getCertifications,
  getFormationsForCertification,
  getQuestions,
  createQuestion,
  updateQuestion,
  toggleQuestionStatus,
  deleteQuestion
} = require('../controllers/formationCertificationController');

const router = express.Router();

// Existing Routes
router.use(protect);

router.get('/dashboard', getDashboardInfo);
router.get('/techniciens', getTechniciensList);
router.get('/techniciens/:techId', getTechnicienDetails);

router.get('/templates', getTemplates);
router.post('/templates/import', requireRole(['ADMIN', 'GL']), importTemplates);
router.delete('/templates/:niveau', requireRole(['ADMIN', 'GL']), deleteTemplate);

router.post('/tests', requireRole(['ADMIN', 'GL', 'SUPERVISEUR']), scheduleTest);
router.get('/tests/:id', getTestDetails);
router.post('/tests/:id/submit', submitTest);
router.delete('/tests/:id', requireRole(['ADMIN', 'GL']), deleteTest);

router.get('/badges/:badgeId', getBadge);
router.delete('/badges/:badgeId', requireRole(['ADMIN']), deleteBadge); // Delete badge

// Certification Routes
router.get('/certifications/:techId', getCertifications);
router.get('/formations/:techId', getFormationsForCertification);

// Question Bank Routes
router.get('/questions', requireRole(['ADMIN']), getQuestions);
router.post('/questions', requireRole(['ADMIN']), createQuestion);
router.put('/questions/:id', requireRole(['ADMIN']), updateQuestion);
router.patch('/questions/:id/status', requireRole(['ADMIN']), toggleQuestionStatus);
router.delete('/questions/:id', requireRole(['ADMIN']), deleteQuestion);

module.exports = router;
