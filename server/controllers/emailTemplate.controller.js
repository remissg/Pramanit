const EmailTemplate = require('../models/EmailTemplate');

const saveTemplate = async (req, res) => {
    try {
        const { name, subject, bodyHtml, isDefault } = req.body;
        const userId = req.user.id;

        if (!name || !subject || !bodyHtml) {
            return res.status(400).json({ message: 'Name, subject, and body are required' });
        }

        // If setting as default, unset others for this user
        if (isDefault) {
            await EmailTemplate.updateMany(
                { user: userId },
                { is_default: false }
            );
        }

        const newTemplate = new EmailTemplate({
            user: userId,
            name,
            subject,
            body_html: bodyHtml,
            is_default: isDefault || false
        });

        await newTemplate.save();

        res.status(201).json({
            id: newTemplate._id,
            name: newTemplate.name,
            created_at: newTemplate.created_at
        });
    } catch (err) {
        console.error('Save template error:', err);
        res.status(500).json({ message: 'Failed to save template' });
    }
};

const getTemplates = async (req, res) => {
    try {
        const userId = req.user.id;
        let templates = await EmailTemplate.find({ user: userId })
            .select('id name subject body_html is_default created_at')
            .sort({ is_default: -1, created_at: -1 });

        // If no templates, inject defaults
        if (templates.length === 0) {
            const defaults = [
                {
                    name: 'Professional',
                    subject: 'Attached: Your Official Certificate for {{event_name}}',
                    body_html: '<p>Dear <strong>{{name}}</strong>,</p><p>Congratulations on your accomplishment! Attached is your official certificate for <strong>{{event_name}}</strong>.</p><p>This credential serves as formal notification of your completion and achievement.</p><p>Best regards,<br><strong>{{issuer_name}}</strong></p>',
                    is_default: true
                },
                {
                    name: 'Casual / Modern',
                    subject: 'You did it! 🎓 Your badge of honor is here',
                    body_html: '<h1>Way to go, {{name}}! 🎉</h1><p>You\'ve successfully completed <strong>{{event_name}}</strong>. We\'re thrilled to share your well-deserved badge of honor with you.</p><p>Keep up the amazing work!</p><p>Cheers,<br>The Team at {{issuer_name}}</p>',
                    is_default: false
                },
                {
                    name: 'Academic',
                    subject: 'Notification of Academic Completion: {{event_name}}',
                    body_html: '<p>To <strong>{{name}}</strong>,</p><p>Please find attached your formal certificate of completion for the academic module <strong>{{event_name}}</strong>.</p><p>This document verifies your successful fulfillment of all required criteria as of today.</p><p>Sincerely,<br>Office of Academic Affairs<br><strong>{{issuer_name}}</strong></p>',
                    is_default: false
                }
            ];

            // Use insertMany for bulk creation
            const createdDefaults = await EmailTemplate.insertMany(
                defaults.map(t => ({
                    user: userId,
                    name: t.name,
                    subject: t.subject,
                    body_html: t.body_html,
                    is_default: t.is_default
                }))
            );

            // Format for response
            templates = createdDefaults.map(t => ({
                id: t._id,
                name: t.name,
                subject: t.subject,
                body_html: t.body_html,
                is_default: t.is_default,
                created_at: t.created_at
            })).sort((a, b) => b.is_default - a.is_default); // Ensure default first
        } else {
            templates = templates.map(t => ({
                id: t._id,
                name: t.name,
                subject: t.subject,
                body_html: t.body_html,
                is_default: t.is_default,
                created_at: t.created_at
            }));
        }

        res.json(templates);
    } catch (err) {
        console.error('Get templates error:', err);
        res.status(500).json({ message: 'Failed to fetch templates' });
    }
};

const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const template = await EmailTemplate.findOne({ _id: id, user: userId });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({
            id: template._id,
            name: template.name,
            subject: template.subject,
            body_html: template.body_html,
            is_default: template.is_default,
            created_at: template.created_at
        });
    } catch (err) {
        console.error('Get template error:', err);
        res.status(500).json({ message: 'Failed to fetch template' });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const template = await EmailTemplate.findOneAndDelete({ _id: id, user: userId });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ message: 'Template deleted successfully' });
    } catch (err) {
        console.error('Delete template error:', err);
        res.status(500).json({ message: 'Failed to delete template' });
    }
};

module.exports = {
    saveTemplate,
    getTemplates,
    getTemplateById,
    deleteTemplate
};
