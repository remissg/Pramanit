const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const BatchReportSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    design_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Design' },
    total_recipients: { type: Number, required: true },
    successful_sends: { type: Number, default: 0 },
    failed_sends: { type: Number, default: 0 },
    
    // Detailed tracking
    successful_emails: [{ 
        email: String, 
        cert_id: String,
        sent_at: { type: Date, default: Date.now }
    }],
    
    failed_emails: [{ 
        email: String, 
        error: String,
        failed_at: { type: Date, default: Date.now }
    }],
    
    status: { 
        type: String, 
        enum: ['processing', 'completed', 'failed'], 
        default: 'processing' 
    },
    
    timestamp: { type: Date, default: Date.now },
    completion_time: { type: Date } // When batch finished
});

// Encryption hooks
BatchReportSchema.pre('save', async function () {
    // Encrypt email addresses for privacy
    if (this.isModified('successful_emails')) {
        this.successful_emails = this.successful_emails.map(item => ({
            ...item,
            email: item.email.includes(':') ? item.email : encrypt(item.email)
        }));
    }
    
    if (this.isModified('failed_emails')) {
        this.failed_emails = this.failed_emails.map(item => ({
            ...item,
            email: item.email.includes(':') ? item.email : encrypt(item.email)
        }));
    }
});

module.exports = mongoose.model('BatchReport', BatchReportSchema);
