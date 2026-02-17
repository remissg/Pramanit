const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User'); // Mongoose Model
const emailService = require('../utils/emailService');
const cryptoUtils = require('../utils/cryptoUtils');
const { uploadToCDN } = require('../utils/cloudinaryService');
const fs = require('fs');

// Ideally move to .env
const JWT_SECRET = process.env.JWT_SECRET || 'certiflow-secure-secret-key-2024';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role }, // Use _id for MongoDB
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const signup = async (req, res) => {
    const { email, password, orgName, fullName, designation } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            email,
            password_hash: hashedPassword,
            org_name: orgName || '',
            full_name: fullName || '',
            designation: designation || '',
            verification_token: verificationToken,
            role: 'user'
        });

        await newUser.save();

        const token = generateToken(newUser);

        // Send verification email (async, don't block response)
        emailService.sendVerificationEmail(newUser.email, verificationToken)
            .then(() => console.log(`Verification email sent to ${newUser.email}`))
            .catch(err => console.error(`Failed to send verification email to ${newUser.email}:`, err));

        res.status(201).json({
            user: {
                id: newUser._id,
                email: newUser.email,
                orgName: newUser.org_name,
                fullName: newUser.full_name,
                designation: newUser.designation,
                role: newUser.role
            },
            token
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error during signup' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            user: {
                id: user._id,
                email: user.email,
                orgName: user.org_name,
                fullName: user.full_name,
                designation: user.designation,
                role: user.role,
                orgLogo: user.org_logo_url,
                planType: user.plan_type,
                isVerified: user.is_verified
            },
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash -verification_token');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            email: user.email,
            orgName: user.org_name,
            fullName: user.full_name,
            designation: user.designation,
            role: user.role,
            orgLogo: user.org_logo_url,
            planType: user.plan_type,
            isVerified: user.is_verified,
            smtpUrl: user.smtp_host // Do not send pass
        });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { verification_token: token },
            { is_verified: true, verification_token: null },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        const jwtToken = generateToken(user);

        res.json({
            message: 'Email verified successfully',
            user: {
                id: user._id,
                email: user.email,
                orgName: user.org_name,
                fullName: user.full_name,
                designation: user.designation,
                role: user.role,
                orgLogo: user.org_logo_url,
                planType: user.plan_type,
                isVerified: user.is_verified
            },
            token: jwtToken
        });
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    const { orgName, fullName, designation, orgLogoUrl, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
    const userId = req.user.id;

    try {
        // Securely encrypt the SMTP password if provided
        const encryptedPass = smtpPass ? cryptoUtils.encrypt(smtpPass) : undefined;

        const updateData = {};
        if (orgName !== undefined) updateData.org_name = orgName;
        if (fullName !== undefined) updateData.full_name = fullName;
        if (designation !== undefined) updateData.designation = designation;
        if (encryptedPass !== undefined) updateData.smtp_pass = encryptedPass;

        // Handle Cloudinary upload for organization logo
        if (req.file) {
            try {
                const cdnResult = await uploadToCDN(req.file.path, 'logos');
                updateData.org_logo_url = cdnResult.secure_url;

                // Cleanup local file after upload
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
            }
        } else if (orgLogoUrl !== undefined) {
            updateData.org_logo_url = orgLogoUrl;
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password_hash -verification_token');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // We return 200 for security to avoid email enumeration
            return res.json({ message: 'If an account with that email exists, we have sent a reset link.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.reset_password_token = hashedToken;
        user.reset_password_expires = Date.now() + 3600000; // 1 hour
        await user.save();

        await emailService.sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'Reset link sent to your email.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            reset_password_token: hashedToken,
            reset_password_expires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
        user.reset_password_token = undefined;
        user.reset_password_expires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

const resendVerification = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.is_verified) {
            return res.status(400).json({ message: 'Account is already verified' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verification_token = verificationToken;
        await user.save();

        // Send verification email
        await emailService.sendVerificationEmail(user.email, verificationToken);

        res.json({ message: 'Verification email resent successfully' });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const users = await User.find({}).select('-password_hash -verification_token');
        res.json(users.map(u => ({
            id: u._id,
            email: u.email,
            orgName: u.org_name,
            fullName: u.full_name,
            role: u.role,
            planType: u.plan_type,
            isVerified: u.is_verified,
            createdAt: u.created_at
        })));
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const toggleUserPlan = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { userId, planType } = req.body;
        if (!userId || !planType) {
            return res.status(400).json({ message: 'User ID and Plan Type are required' });
        }

        const user = await User.findByIdAndUpdate(userId, { plan_type: planType }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: `Plan updated to ${planType}`, user: { id: user._id, planType: user.plan_type } });
    } catch (err) {
        console.error('Toggle plan error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    verifyEmail,
    updateProfile,
    resendVerification,
    getAllUsers,
    toggleUserPlan,
    forgotPassword,
    resetPassword
};
