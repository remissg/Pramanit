const mongoose = require('mongoose');

const OtpTokenSchema = new mongoose.Schema({
    email_hash: { type: String, required: true, index: true },
    otp_hash: { type: String, required: true },
    created_at: { type: Date, default: Date.now, expires: 600 } // Auto-deletes after 10 minutes (600 seconds)
});

module.exports = mongoose.model('OtpToken', OtpTokenSchema);
