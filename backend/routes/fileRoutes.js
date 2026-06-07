const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const {
  uploadFile,
  getAllFiles,
  getFileById,
  downloadFile,
  deleteFile,
} = require('../controllers/fileController');
const { uploadLimiter, validateFileUpload } = require('../middleware/securityMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/upload', uploadLimiter, upload.single('file'), validateFileUpload, uploadFile);
router.get('/files', getAllFiles);
router.get('/download/:id', downloadFile);
router.get('/files/:id', getFileById);
router.delete('/files/:id', deleteFile);

module.exports = router;
