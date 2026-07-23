const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const { authenticate } = require('../middlewares/authMiddleware');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup multer for local file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticate);

router.get('/', knowledgeBaseController.getKnowledgeBases);
router.post('/', knowledgeBaseController.createKnowledgeBase);

router.get('/:id/documents', knowledgeBaseController.getDocuments);
router.post('/:id/documents', upload.single('file'), knowledgeBaseController.uploadDocument);
router.delete('/:id/documents/:docId', knowledgeBaseController.deleteDocument);

module.exports = router;
