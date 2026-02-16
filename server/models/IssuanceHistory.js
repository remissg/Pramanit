const mongoose = require('mongoose');

const IssuanceHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    design_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Design' },
    design_name: { type: String }, // Redundant store for historical accuracy
    total_certificates: { type: Number, default: 0 },
    recipient_emails: { type: [String], default: [] }, // Array of strings
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IssuanceHistory', IssuanceHistorySchema);
