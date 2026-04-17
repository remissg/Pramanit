const express = require('express');
const router = express.Router();
const {
    getBatchReports,
    getBatchReportDetails,
    getBatchStats
} = require('../controllers/batchReport.controller');
const { authenticateToken } = require('../routes/auth.routes');

// Get all batch reports for user
router.get('/', authenticateToken, getBatchReports);

// Get batch statistics
router.get('/stats', authenticateToken, getBatchStats);

// Get specific batch report details
router.get('/:id', authenticateToken, getBatchReportDetails);

module.exports = router;
