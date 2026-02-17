const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const certificateController = require('../controllers/certificate.controller');
const { authenticateToken } = require('./auth.routes');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

// Define routes
router.post('/prepare-batch', authenticateToken, upload.single('template'), certificateController.prepareBatch);
router.post('/process-single', authenticateToken, certificateController.processSingle);

router.post('/upload', authenticateToken, upload.fields([{ name: 'template' }, { name: 'data' }]), certificateController.processCertificates);
router.post('/test-email', authenticateToken, certificateController.sendEmail);
router.post('/preview-batch', authenticateToken, upload.fields([{ name: 'template' }, { name: 'data' }]), certificateController.previewBatch);
router.get('/history', authenticateToken, certificateController.getIssuanceHistory);
router.get('/verify/:id', certificateController.verifyCertificate);
router.get('/portal', certificateController.getRecipientPortal);
router.post('/request-correction', certificateController.requestCorrection);
router.get('/corrections', authenticateToken, certificateController.getCorrectionRequests);
router.post('/corrections/action', authenticateToken, certificateController.handleCorrectionAction);

module.exports = router;
