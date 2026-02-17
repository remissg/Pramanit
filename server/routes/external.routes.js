const express = require('express');
const router = express.Router();
const externalController = require('../controllers/external.controller');
const { authenticateToken } = require('./auth.routes');

// API Key Management (Protected - User Session)
router.get('/keys', authenticateToken, externalController.getApiKey);
router.post('/keys/rotate', authenticateToken, externalController.rotateApiKey);
router.post('/webhook/url', authenticateToken, externalController.updateWebhook);

// Programmatic Features (X-API-KEY Auth)
router.post('/issue', externalController.issueCertificate);

module.exports = router;
