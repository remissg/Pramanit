const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema({
    cert_id: { type: String, required: true, unique: true },
    recipient_name: { type: String, required: true },
    recipient_email: { type: String }, // Optional
    issuer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added for 4-Pillars compliance
    issuer_name: { type: String, required: true },
    issue_date: { type: Date, required: true },
    data_hash: { type: String, required: true },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    scan_count: { type: Number, default: 0 },
    org_name: { type: String },
    issuer_designation: { type: String },
    org_logo_url: { type: String },
    issuer_email: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Verification', VerificationSchema);
