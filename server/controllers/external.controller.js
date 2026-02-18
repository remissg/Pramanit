const User = require('../models/User');
const Verification = require('../models/Verification');
const crypto = require('crypto');

// Generate a secure API Key
const generateApiKey = () => {
    return `cf_${crypto.randomBytes(24).toString('hex')}`;
};

// Get current API key
const getApiKey = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ apiKey: user.api_key });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve API key", error: error.message });
    }
};

// Rotate API Key
const rotateApiKey = async (req, res) => {
    try {
        const newKey = generateApiKey();
        await User.findByIdAndUpdate(req.user.id, { api_key: newKey });
        res.json({ apiKey: newKey });
    } catch (error) {
        res.status(500).json({ message: "Failed to rotate API key", error: error.message });
    }
};

// Update Webhook URL
const updateWebhook = async (req, res) => {
    try {
        const { url } = req.body;
        await User.findByIdAndUpdate(req.user.id, { webhook_url: url });
        res.json({ message: "Webhook URL updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update webhook", error: error.message });
    }
};

// PROGRAMMATIC ISSUANCE
const issueCertificate = async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) return res.status(401).json({ message: "API Key is required" });

        const user = await User.findOne({ api_key: apiKey });
        if (!user) return res.status(401).json({ message: "Invalid API Key" });

        const { recipient_name, recipient_email, issue_date, metadata } = req.body;

        if (!recipient_name) return res.status(400).json({ message: "Recipient name is required" });

        const certId = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;

        const newVerification = new Verification({
            cert_id: certId,
            recipient_name,
            recipient_email,
            issuer_id: user._id,
            issuer_name: user.full_name || user.org_name || 'Pramanit Issuer',
            issuer_email: user.email,
            issue_date: issue_date || new Date(),
            org_name: user.org_name,
            issuer_designation: user.designation,
            org_logo_url: user.org_logo_url,
            data_hash: crypto.createHash('sha256').update(`${certId}-${recipient_name}-${Date.now()}`).digest('hex'),
            status: 'active'
        });

        await newVerification.save();

        // Trigger Webhook if configured
        const webhookService = require('../utils/webhookService');
        if (user.webhook_url) {
            webhookService.sendWebhook(user.webhook_url, 'certificate.issued', {
                cert_id: certId,
                recipient_name,
                recipient_email,
                issued_at: newVerification.created_at
            });
        }

        const clientUrl = process.env.FRONTEND_URL ? `https://${process.env.FRONTEND_URL}` : 'http://localhost:5173';
        res.status(201).json({
            message: "Certificate issued successfully",
            cert_id: certId,
            verification_url: `${clientUrl}/verify/${certId}`
        });

    } catch (error) {
        console.error("API Issuance Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = { getApiKey, rotateApiKey, updateWebhook, issueCertificate };
