const express = require('express');
const router = express.Router();
const {
  verifyText,
  verifyUpload,
  verifyUrl,
  verifyDemo,
  getVerifications,
  getVerification,
  deleteVerification,
} = require('../controllers/verificationController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

router.post('/text', optionalAuth, verifyText);
router.post('/upload', optionalAuth, upload.single('file'), handleUploadError, verifyUpload);
router.post('/url', optionalAuth, verifyUrl);
router.post('/demo', optionalAuth, verifyDemo);

router.get('/', optionalAuth, getVerifications);
router.get('/:id', optionalAuth, getVerification);
router.delete('/:id', optionalAuth, deleteVerification);

module.exports = router;
