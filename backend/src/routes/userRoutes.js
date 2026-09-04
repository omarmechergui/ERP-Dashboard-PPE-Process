const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
  getUsers, 
  getTeamUsers, 
  getOrganizationData,
  createUser, 
  updateUser, 
  deleteUser,
  uploadUserPhoto,
  getUserAuditLogs
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

const router = express.Router();

// Setup Multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/photos/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format de fichier non supporté. (JPG, PNG, WEBP acceptés)"));
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const photoDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(photoDir)){
    fs.mkdirSync(photoDir, { recursive: true });
}

// All routes require authentication
router.use(protect);

// Organization and Team Data (accessible to specific roles or everyone)
router.get('/team', getTeamUsers);
router.get('/organization', getOrganizationData);

// Audit logs (ADMIN only)
router.get('/audit', requireRole(['ADMIN']), getUserAuditLogs);

// Photo upload (ADMIN only)
router.post('/:id/photo', requireRole(['ADMIN']), upload.single('photo'), uploadUserPhoto);

// User CRUD (ADMIN only)
router.use(requireRole(['ADMIN']));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
