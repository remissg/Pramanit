const express = require('express');
const router = express.Router();
const designController = require('../controllers/design.controller');
const { authenticateToken } = require('./auth.routes');

router.post('/', authenticateToken, designController.saveDesign);
router.get('/', authenticateToken, designController.getDesigns);
router.get('/:id', authenticateToken, designController.getDesignById);
router.delete('/:id', authenticateToken, designController.deleteDesign);

module.exports = router;
