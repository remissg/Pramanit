const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
    maintenance_mode: { type: Boolean, default: false },
    announcement_banner: { type: String, default: 'Pramanit Verifiable Credential Engine Active' },
    enforce_tier_limits: { type: Boolean, default: false }, // Default OFF so limits don't block testing
    free_cert_limit: { type: Number, default: 50 },
    pro_cert_limit: { type: Number, default: 10000 },
    pro_monthly_price: { type: Number, default: 1499 },
    pro_annual_price: { type: Number, default: 14990 },
    currency_symbol: { type: String, default: '₹' },
    free_features: {
        type: [String],
        default: [
            '50 Certificates / Month',
            'Standard QR Verification Badge',
            'CSV Bulk Certificate Issue',
            'Basic Email Templates',
            'Community Support'
        ]
    },
    pro_features: {
        type: [String],
        default: [
            '10,000 Certificates / Month',
            'Custom Institutional Logo & Watermarks',
            'Custom Subdomain & QR Branding',
            'Dedicated Custom SMTP Email Relay',
            'Batch ZIP Download & Analytics',
            '24/7 Priority Support & SLA'
        ]
    },
    fallback_smtp_host: { type: String, default: 'smtp.gmail.com' },
    fallback_smtp_port: { type: Number, default: 587 }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
