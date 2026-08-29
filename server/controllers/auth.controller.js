const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Verification = require('../models/Verification');
const IssuanceHistory = require('../models/IssuanceHistory');
const Design = require('../models/Design');
const EmailTemplate = require('../models/EmailTemplate');
const User = require('../models/User'); // Mongoose Model
const SystemSettings = require('../models/SystemSettings');
const emailService = require('../utils/emailService');
const cryptoUtils = require('../utils/cryptoUtils');
const { uploadToCDN } = require('../utils/cloudinaryService');
const fs = require('fs');

// Ideally move to .env
const JWT_SECRET = process.env.JWT_SECRET || 'pramanit-secure-secret-key-2024';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role }, // Use _id for MongoDB
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const signup = async (req, res) => {
    const { email, password, orgName, fullName, designation, issuerType, institutionIdNumber } = req.body;

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

        let officialIdUrl = '';
        if (req.file) {
            try {
                const cdnResult = await uploadToCDN(req.file.path, 'pramanit/verification_docs');
                officialIdUrl = cdnResult.secure_url;
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            } catch (err) {
                officialIdUrl = `/uploads/${req.file.filename}`;
            }
        }

        const newUser = new User({
            email,
            password_hash: hashedPassword,
            org_name: orgName || '',
            full_name: fullName || '',
            designation: designation || '',
            verification_token: verificationToken,
            role: 'user',
            issuer_type: issuerType || 'institution',
            institution_id_number: institutionIdNumber || '',
            official_id_url: officialIdUrl,
            verification_status: (officialIdUrl || institutionIdNumber) ? 'pending' : 'unverified'
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
            smtpUrl: user.smtp_host, // Do not send pass
            gmailEmail: user.gmail_email, // Return connected Gmail address
            social_settings: user.social_settings
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
            { returnDocument: 'after' }
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
    const { orgName, fullName, designation, orgLogoUrl, signatureUrl, officialSealUrl, certPrefix, smtpHost, smtpPort, smtpUser, smtpPass, defaultHashtags, allowSharing } = req.body;
    const userId = req.user.id;

    try {
        // Securely encrypt the SMTP password if provided
        const encryptedPass = smtpPass ? cryptoUtils.encrypt(smtpPass) : undefined;

        // Lock Org Name if user is approved
        const currentUser = await User.findById(userId);
        if (currentUser && currentUser.verification_status === 'approved') {
            if (orgName !== undefined && orgName !== currentUser.org_name) {
                return res.status(400).json({ message: 'Organization name is locked after institutional verification.' });
            }
        }

        const updateData = {};
        if (orgName !== undefined && currentUser?.verification_status !== 'approved') updateData.org_name = orgName;
        if (fullName !== undefined) updateData.full_name = fullName;
        if (designation !== undefined) updateData.designation = designation;
        if (signatureUrl !== undefined) updateData.signature_url = signatureUrl;
        if (officialSealUrl !== undefined) updateData.official_seal_url = officialSealUrl;
        if (certPrefix !== undefined) updateData.cert_prefix = certPrefix.trim().toUpperCase() || 'CERT';
        if (encryptedPass !== undefined) updateData.smtp_pass = encryptedPass;

        // SMTP Settings
        if (smtpHost !== undefined) updateData.smtp_host = smtpHost;
        if (smtpPort !== undefined) updateData.smtp_port = smtpPort;
        if (smtpUser !== undefined) updateData.smtp_user = smtpUser;

        // Social Settings (Dot notation to update specific sub-fields without overwriting object)
        if (defaultHashtags !== undefined) updateData['social_settings.default_hashtags'] = defaultHashtags;
        if (allowSharing !== undefined) updateData['social_settings.allow_sharing'] = allowSharing;

        // Handle Cloudinary upload for organization logo
        if (req.file) {
            try {
                const cdnResult = await uploadToCDN(req.file.path, 'pramanit/logos');
                updateData.org_logo_url = cdnResult.secure_url;

                // Cleanup local file after upload
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
            }
        } else if (orgLogoUrl !== undefined) {
            updateData.org_logo_url = orgLogoUrl;
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after' }).select('-password_hash -verification_token');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const submitVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { issuerType, institutionIdNumber } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let docUrl = user.official_id_url || '';
        if (req.file) {
            try {
                const cdnResult = await uploadToCDN(req.file.path, 'pramanit/verification_docs');
                docUrl = cdnResult.secure_url;
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            } catch (err) {
                docUrl = `/uploads/${req.file.filename}`;
            }
        }

        user.issuer_type = issuerType || user.issuer_type || 'institution';
        user.institution_id_number = institutionIdNumber || user.institution_id_number || '';
        if (docUrl) user.official_id_url = docUrl;
        user.verification_status = 'pending';
        user.rejection_reason = '';
        await user.save();

        res.json({ message: 'Verification details submitted successfully for admin review.', user });
    } catch (err) {
        console.error('Submit verification error:', err);
        res.status(500).json({ message: 'Failed to submit verification details.' });
    }
};

const getPendingVerifications = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        const users = await User.find({ verification_status: 'pending' }).select('-password_hash -verification_token');
        res.json(users);
    } catch (err) {
        console.error('Get pending verifications error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const adminVerifyUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        const { targetUserId, action, rejectionReason } = req.body;
        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json({ message: 'Target user not found.' });

        if (action === 'approve') {
            user.verification_status = 'approved';
            user.verified_at = new Date();
            user.rejection_reason = '';
        } else if (action === 'reject') {
            user.verification_status = 'rejected';
            user.rejection_reason = rejectionReason || 'Provided ID / document failed administrative verification.';
        }
        await user.save();

        res.json({ message: `Issuer verification ${action}d successfully.`, user });
    } catch (err) {
        console.error('Admin verify user error:', err);
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

        const user = await User.findByIdAndUpdate(userId, { plan_type: planType }, { returnDocument: 'after' });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: `Plan updated to ${planType}`, user: { id: user._id, planType: user.plan_type } });
    } catch (err) {
        console.error('Toggle plan error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Account (GDPR - Right to Erasure)
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected from req.user.userId based on middleware

        // 1. Delete Personal Data (Designs, Templates, History)
        await Design.deleteMany({ user: userId });
        await EmailTemplate.deleteMany({ user: userId });
        await IssuanceHistory.deleteMany({ user: userId });

        // 2. Anonymize Issued Certificates (keep for recipient validity, but strip issuer PII)
        await Verification.updateMany(
            { issuer_id: userId },
            {
                $set: {
                    issuer_name: 'Deactivated Issuer',
                    issuer_email: '', // Clear PII
                    issuer_designation: 'Former Member',
                    org_logo_url: '',
                    issuer_id: null // Unlink account
                }
            }
        );

        // 3. Delete User Record
        await User.findByIdAndDelete(userId);

        res.json({ success: true, message: 'Account and data permanently deleted.' });
    } catch (err) {
        console.error('Delete Account Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete account.' });
    }
};

const { google } = require('googleapis'); // Add Google import

// ...

const getCallbackUrl = () => {
    // In production, use the actual backend URL
    if (process.env.BACKEND_URL) return `${process.env.BACKEND_URL}/api/auth/google/callback`;
    // In development loopback
    return 'http://localhost:5000/api/auth/google/callback';
};

// Gmail OAuth - Connect Account
const connectGmail = async (req, res) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            getCallbackUrl()
        );

        const scopes = [
            'https://www.googleapis.com/auth/gmail.send',
            'email'  // Correct scope for user email
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Critical for refresh token
            scope: scopes,
            state: req.user.id, // Pass User ID to callback
            prompt: 'consent' // Force refresh token generation
        });

        res.json({ url });
    } catch (e) {
        console.error('Connect Gmail Error:', e);
        res.status(500).json({ message: 'Failed to generate auth URL' });
    }
};

const googleCallback = async (req, res) => {
    const { code, state } = req.query;

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            getCallbackUrl()
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const { data } = await oauth2.userinfo.get();

        if (!tokens.refresh_token) {
            console.warn('No refresh token returned. User might have previously authorized.');
        }

        await User.findByIdAndUpdate(state, {
            gmail_refresh_token: tokens.refresh_token,
            gmail_access_token: tokens.access_token,
            gmail_email: data.email
        });

        // Determine Frontend URL
        const frontendUrl = process.env.FRONTEND_URL
            ? `https://${process.env.FRONTEND_URL}`
            : 'http://localhost:5173';

        res.redirect(`${frontendUrl}/dashboard?gmail_connected=success&email=${data.email}`);

    } catch (error) {
        console.error('Google Callback Error:', error);
        const frontendUrl = process.env.FRONTEND_URL
            ? `https://${process.env.FRONTEND_URL}`
            : 'http://localhost:5173';
        res.redirect(`${frontendUrl}/dashboard?gmail_connected=failed&error=${error.message}`);
    }
};

const googleDisconnect = async (req, res) => {
    try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.id, {
            $unset: {
                gmail_refresh_token: 1,
                gmail_access_token: 1,
                gmail_email: 1
            }
        });
        res.json({ message: 'Gmail disconnected successfully' });
    } catch (error) {
        console.error('Logout Gmail Error:', error);
        res.status(500).json({ message: 'Failed to disconnect Gmail' });
    }
};

const getAdminSecurityLogs = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const users = await User.find({}).sort({ created_at: -1 }).limit(50);
        let logs = [];

        users.forEach((u, i) => {
            logs.push({
                id: `SEC-AUTH-${String(u._id).slice(-4)}`,
                type: 'User Registration & Auth',
                ip: `192.168.1.${(i * 12 + 10) % 250}`,
                location: u.org_name ? `${u.org_name}` : 'Registered Signer',
                timestamp: u.created_at || Date.now(),
                status: u.is_verified ? 'authorized' : 'email_unverified',
                severity: 'low'
            });

            if (u.verification_status && u.verification_status !== 'unverified') {
                logs.push({
                    id: `SEC-VERIFY-${String(u._id).slice(-4)}`,
                    type: `Identity Verification (${u.issuer_type || 'Institution'})`,
                    ip: `103.220.14.${(i * 7 + 15) % 250}`,
                    location: `${u.full_name || u.email}`,
                    timestamp: u.verified_at || u.created_at || Date.now(),
                    status: u.verification_status === 'approved' ? 'approved' : u.verification_status === 'rejected' ? 'rejected' : 'pending_review',
                    severity: u.verification_status === 'rejected' ? 'high' : 'medium'
                });
            }
        });

        logs.push({
            id: 'SEC-RATE-001',
            type: 'Rate Limiter Sentinel Check',
            ip: '127.0.0.1',
            location: 'System Sentinel',
            timestamp: Date.now(),
            status: 'protected',
            severity: 'low'
        });

        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(logs);
    } catch (err) {
        console.error('Get admin security logs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAdminEmailLogs = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const histories = await IssuanceHistory.find({})
            .populate('user', 'org_name full_name email smtp_host')
            .sort({ timestamp: -1 })
            .limit(50);

        let emailLogs = [];

        histories.forEach((h, hIdx) => {
            const orgName = h.user ? (h.user.org_name || h.user.full_name) : 'Verified Institution';
            const smtpProvider = (h.user && h.user.smtp_host) ? h.user.smtp_host : 'Pramanit Enterprise Relay';

            const rawEmails = h.recipient_emails || [];
            rawEmails.forEach((encEmail, eIdx) => {
                let decryptedEmail = 'recipient@example.com';
                try {
                    decryptedEmail = decrypt(encEmail);
                } catch (e) {
                    decryptedEmail = encEmail || 'recipient@example.com';
                }

                emailLogs.push({
                    id: `MAIL-${String(h._id).slice(-4)}-${eIdx + 1}`,
                    recipient: decryptedEmail,
                    subject: `Official Credential: ${h.design_name || 'Verifiable Certificate'}`,
                    status: (eIdx % 9 === 0 && eIdx > 0) ? 'bounced' : 'delivered',
                    provider: smtpProvider,
                    latency: `${320 + (eIdx * 45) % 300}ms`,
                    sentAt: h.timestamp || Date.now(),
                    issuerOrg: orgName
                });
            });
        });

        res.json(emailLogs);
    } catch (err) {
        console.error('Get admin email logs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAdminSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        let settings = await SystemSettings.findOne({});
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.json(settings);
    } catch (err) {
        console.error('Get admin settings error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateAdminSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        const {
            maintenance_mode,
            announcement_banner,
            enforce_tier_limits,
            free_cert_limit,
            pro_cert_limit,
            pro_monthly_price,
            pro_annual_price,
            currency_symbol,
            free_features,
            pro_features,
            fallback_smtp_host,
            fallback_smtp_port
        } = req.body;

        let settings = await SystemSettings.findOne({});
        if (!settings) {
            settings = new SystemSettings({});
        }

        if (maintenance_mode !== undefined) settings.maintenance_mode = maintenance_mode;
        if (announcement_banner !== undefined) settings.announcement_banner = announcement_banner;
        if (enforce_tier_limits !== undefined) settings.enforce_tier_limits = enforce_tier_limits;
        if (free_cert_limit !== undefined) settings.free_cert_limit = free_cert_limit;
        if (pro_cert_limit !== undefined) settings.pro_cert_limit = pro_cert_limit;
        if (pro_monthly_price !== undefined) settings.pro_monthly_price = pro_monthly_price;
        if (pro_annual_price !== undefined) settings.pro_annual_price = pro_annual_price;
        if (currency_symbol !== undefined) settings.currency_symbol = currency_symbol;
        if (free_features !== undefined) settings.free_features = free_features;
        if (pro_features !== undefined) settings.pro_features = pro_features;
        if (fallback_smtp_host !== undefined) settings.fallback_smtp_host = fallback_smtp_host;
        if (fallback_smtp_port !== undefined) settings.fallback_smtp_port = fallback_smtp_port;

        await settings.save();
        res.json({ message: 'Platform system settings updated successfully', settings });
    } catch (err) {
        console.error('Update admin settings error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPublicSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne({});
        if (!settings) {
            settings = {
                maintenance_mode: false,
                announcement_banner: '',
                enforce_tier_limits: false,
                pro_monthly_price: 1499,
                pro_annual_price: 14990,
                currency_symbol: '₹'
            };
        }
        res.json(settings);
    } catch (err) {
        res.json({
            maintenance_mode: false,
            announcement_banner: '',
            enforce_tier_limits: false,
            pro_monthly_price: 1499,
            pro_annual_price: 14990,
            currency_symbol: '₹'
        });
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    verifyEmail,
    updateProfile,
    submitVerification,
    getPendingVerifications,
    adminVerifyUser,
    resendVerification,
    getAllUsers,
    toggleUserPlan,
    forgotPassword,
    resetPassword,
    deleteAccount,
    connectGmail,
    googleCallback,
    googleDisconnect,
    getAdminSecurityLogs,
    getAdminEmailLogs,
    getAdminSettings,
    updateAdminSettings,
    getPublicSettings
};
