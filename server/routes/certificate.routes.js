const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { processBatch } = require('../controllers/certificate.controller');

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
router.post(
    '/upload',
    upload.fields([{ name: 'template', maxCount: 1 }, { name: 'data', maxCount: 1 }]),
    processBatch
);

router.post('/test-email', upload.none(), require('../controllers/certificate.controller').sendTestEmail);

module.exports = router;
