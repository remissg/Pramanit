const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const EmailSettingsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Sender Information
    sender_name: { type: String, default: '' },
    sender_email: { type: String, default: '' },
    reply_to_email: { type: String, default: '' },
    
    // Email Configuration
    email_method: { 
        type: String, 
        enum: ['gmail-api', 'custom-smtp', 'system-default'], 
        default: 'gmail-api' 
    },
    
    // Custom SMTP Settings (if chosen)
    smtp_host: { type: String, default: '' },
    smtp_port: { type: Number, default: 587 },
    smtp_user: { type: String, default: '' },
    smtp_pass: { type: String, default: '' },
    
    // Gmail OAuth Settings
    gmail_refresh_token: { type: String, default: '' },
    gmail_access_token: { type: String, default: '' },
    gmail_email: { type: String, default: '' },
    
    // Email Preferences
    allow_recipient_contact: { type: Boolean, default: true },
    contact_email: { type: String, default: '' },
    contact_phone: { type: String, default: '' },
    
    // Email Footer Settings
    show_issuer_signature: { type: Boolean, default: true },
    custom_footer: { type: String, default: '' }
});

// Encryption hooks
EmailSettingsSchema.pre('save', async function () {
    if (this.isModified('smtp_pass')) {
        this.smtp_pass = encrypt(this.smtp_pass);
    }
    if (this.isModified('gmail_refresh_token')) {
        this.gmail_refresh_token = encrypt(this.gmail_refresh_token);
    }
    if (this.isModified('gmail_access_token')) {
        this.gmail_access_token = encrypt(this.gmail_access_token);
    }
});

module.exports = mongoose.model('EmailSettings', EmailSettingsSchema);
