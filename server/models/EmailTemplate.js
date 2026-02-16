const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body_html: { type: String, required: true },
    is_default: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

// Ensure only one default template per user
EmailTemplateSchema.index({ user: 1, is_default: 1 }, { unique: true, partialFilterExpression: { is_default: true } });

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);
