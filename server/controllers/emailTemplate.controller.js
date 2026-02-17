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

        // Fetch both user templates and system templates
        let templates = await EmailTemplate.find({
            $or: [
                { user: userId },
                { is_system: true }
            ]
        })
            .select('id name subject body_html is_default is_system created_at')
            .sort({ is_system: -1, is_default: -1, created_at: -1 });

        // Map for consistent response
        const formattedTemplates = templates.map(t => ({
            id: t._id,
            name: t.name,
            subject: t.subject,
            body_html: t.body_html,
            is_default: t.is_default,
            is_system: t.is_system,
            created_at: t.created_at
        }));

        res.json(formattedTemplates);
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

        const template = await EmailTemplate.findOne({ _id: id, user: userId });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (template.is_system) {
            return res.status(403).json({ message: 'System templates cannot be deleted' });
        }

        await EmailTemplate.findByIdAndDelete(id);

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
