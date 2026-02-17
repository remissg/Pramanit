const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Configure Multer for profile uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

//Ideally import from env
const JWT_SECRET = process.env.JWT_SECRET || 'certiflow-secure-secret-key-2024';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/update-profile', authenticateToken, upload.single('orgLogo'), authController.updateProfile);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authenticateToken, authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/admin/users', authenticateToken, authController.getAllUsers);
router.post('/admin/toggle-plan', authenticateToken, authController.toggleUserPlan);

module.exports = {
    router,
    authenticateToken
};
