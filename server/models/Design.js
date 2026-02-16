const mongoose = require('mongoose');

const DesignSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    design_json: { type: Object, required: true }, // Store JSON directly
    preview_url: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Design', DesignSchema);
