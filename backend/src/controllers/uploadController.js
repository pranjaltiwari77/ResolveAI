const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

exports.uploadMiddleware = upload.single('file');

exports.handleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the URL path
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Determine type
    let fileType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('audio/') || req.file.mimetype === 'video/webm' || req.file.mimetype === 'audio/webm') {
      // MediaRecorder often outputs video/webm even for audio-only streams on some browsers
      fileType = 'audio';
    }

    res.status(200).json({
      url: fileUrl,
      type: fileType,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};
