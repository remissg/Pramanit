const express = require('express');
const router = express.Router();
const { 
    createContactMessage, 
    getIssuerMessages, 
    respondToMessage 
} = require('../controllers/contactMessage.controller');

// Public endpoint for recipients to contact issuers
router.post('/contact-issuer', createContactMessage);

// Issuer endpoints (protected)
const { authenticateToken } = require('../routes/auth.routes');

router.get('/messages', authenticateToken, getIssuerMessages);
router.post('/messages/:id/respond', authenticateToken, respondToMessage);

module.exports = router;
