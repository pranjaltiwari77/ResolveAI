const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/authMiddleware');

// Upload a single file, protected by auth
router.post('/', authenticate, uploadController.uploadMiddleware, uploadController.handleUpload);

module.exports = router;
