const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const ContactMessageSchema = new mongoose.Schema({
    // Recipient Information
    recipient_email: { type: String, required: true },
    recipient_name: { type: String, default: '' },
    certificate_id: { type: String, required: true },
    
    // Issuer Information (who should receive this message)
    issuer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Message Details
    subject: { type: String, required: true },
    message: { type: String, required: true },
    message_type: { 
        type: String, 
        enum: ['name_correction', 'email_change', 'certificate_issue', 'general_inquiry'], 
        default: 'general_inquiry' 
    },
    
    // Status Tracking
    status: { 
        type: String, 
        enum: ['pending', 'read', 'responded', 'resolved'], 
        default: 'pending' 
    },
    
    // Response from Issuer
    issuer_response: { type: String, default: '' },
    responded_at: { type: Date },
    
    // Timestamps
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Encryption hook for recipient email
ContactMessageSchema.pre('save', async function () {
    if (this.isModified('recipient_email')) {
        this.recipient_email = encrypt(this.recipient_email);
    }
});

// Update timestamp on modification
ContactMessageSchema.pre('save', function () {
    this.updated_at = new Date();
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
