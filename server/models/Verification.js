const mongoose = require('mongoose');
const { encrypt, decrypt, hash } = require('../utils/encryption');

const VerificationSchema = new mongoose.Schema({
    cert_id: { type: String, required: true, unique: true },
    recipient_name: { type: String, required: true },
    recipient_email: { type: String }, // Stored as Ciphertext (IV:EncryptedData)
    recipient_email_hash: { type: String, index: true }, // Blind Index for searching
    issuer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added for 4-Pillars compliance
    design_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Design' }, // Added for OG Image generation
    issuer_name: { type: String, required: true },
    issue_date: { type: Date, required: true },
    data_hash: { type: String, required: true },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    scan_count: { type: Number, default: 0 },
    org_name: { type: String },
    issuer_designation: { type: String },
    org_logo_url: { type: String },
    issuer_email: { type: String },
    recipient_token: { type: String, unique: true }, // Magic Link token
    correction_requested: { type: Boolean, default: false },
    requested_name: { type: String },
    correction_status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    certificate_title: { type: String }, // For LinkedIn/Social metadata
    created_at: { type: Date, default: Date.now }
});

// Encryption Hook
VerificationSchema.pre('save', function (next) {
    if (this.isModified('recipient_email') && this.recipient_email) {
        // Generate blind index before encryption
        this.recipient_email_hash = hash(this.recipient_email);
        // Encrypt the email
        this.recipient_email = encrypt(this.recipient_email);
    }
    next();
});

// Decryption Method
VerificationSchema.methods.getDecryptedEmail = function () {
    return decrypt(this.recipient_email);
};

module.exports = mongoose.model('Verification', VerificationSchema);
