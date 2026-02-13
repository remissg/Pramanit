const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplate.controller');
const { authenticateToken } = require('./auth.routes');

router.post('/', authenticateToken, emailTemplateController.saveTemplate);
router.get('/', authenticateToken, emailTemplateController.getTemplates);
router.get('/:id', authenticateToken, emailTemplateController.getTemplateById);
router.delete('/:id', authenticateToken, emailTemplateController.deleteTemplate);

module.exports = router;
