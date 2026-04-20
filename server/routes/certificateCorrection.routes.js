const express = require('express');
const router = express.Router();
const { 
    getCorrectionRequests,
    submitCorrectionRequest,
    processCorrection,
    regenerateCertificate,
    getCorrectionStats
} = require('../controllers/certificateCorrection.controller');
const { authenticateToken } = require('../routes/auth.routes');

// Public endpoint for recipients to submit correction requests
router.post('/request', submitCorrectionRequest);

// Issuer endpoints (protected)
router.get('/requests', authenticateToken, getCorrectionRequests);
router.get('/stats', authenticateToken, getCorrectionStats);
router.post('/process', authenticateToken, processCorrection);
router.post('/regenerate', authenticateToken, regenerateCertificate);

module.exports = router;
