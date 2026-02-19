const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const IssuanceHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    design_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Design' },
    design_name: { type: String }, // Redundant store for historical accuracy
    total_certificates: { type: Number, default: 0 },
    recipient_emails: { type: [String], default: [] }, // Array of strings (Encrypted)
    timestamp: { type: Date, default: Date.now }
});

// Encryption Hook for array
// Encryption Hook for array
IssuanceHistorySchema.pre('save', async function () {
    if (this.isModified('recipient_emails') && this.recipient_emails && this.recipient_emails.length > 0) {
        this.recipient_emails = this.recipient_emails.map(email => {
            // Check if already encrypt (contains colon)
            if (email.includes(':')) return email;
            try {
                return encrypt(email);
            } catch (error) {
                console.error('Encryption failed for email:', email, error);
                return email; // Fallback to plain text on error to avoid data loss
            }
        });
    }
});

module.exports = mongoose.model('IssuanceHistory', IssuanceHistorySchema);
