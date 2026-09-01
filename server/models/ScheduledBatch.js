const mongoose = require('mongoose');

const ScheduledBatchSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    design_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Design' },
    design_name: { type: String, required: true },
    scheduled_for: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'processing', 'completed', 'cancelled', 'failed'], default: 'scheduled' },
    dispatch_pace: { type: String, enum: ['safe', 'fast', 'drip'], default: 'safe' }, // safe: 2.5s, fast: 1.0s, drip: 5.0s
    recipients_data: { type: mongoose.Schema.Types.Mixed, required: true }, // Array of recipient objects
    email_config: { type: mongoose.Schema.Types.Mixed, default: {} }, // Custom subject and emailBody
    design_config: { type: mongoose.Schema.Types.Mixed, default: {} }, // Complete design configuration
    processed_count: { type: Number, default: 0 },
    total_recipients: { type: Number, default: 0 },
    error_log: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    completed_at: { type: Date }
});

module.exports = mongoose.model('ScheduledBatch', ScheduledBatchSchema);
