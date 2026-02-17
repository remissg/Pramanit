const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticateToken } = require('./auth.routes');

// Protected route: Only logged-in users can use AI features
router.post('/generate-content', authenticateToken, aiController.generateContent);
router.post('/predict-layout', authenticateToken, aiController.predictLayout);

module.exports = router;
