const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    org_name: { type: String, default: '' },
    full_name: { type: String, default: '' },
    designation: { type: String, default: '' },
    role: { type: String, default: 'user' },
    verification_token: { type: String },
    is_verified: { type: Boolean, default: false },
    org_logo_url: { type: String },
    plan_type: { type: String, default: 'free' },
    smtp_host: { type: String },
    smtp_port: { type: Number },
    smtp_user: { type: String },
    smtp_pass: { type: String },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
    api_key: { type: String, unique: true, sparse: true },
    webhook_url: { type: String, default: '' },
    social_settings: {
        default_hashtags: { type: String, default: '#CertiFlow #Certified #Professional' },
        allow_sharing: { type: Boolean, default: true }
    },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
