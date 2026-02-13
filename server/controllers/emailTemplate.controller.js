const db = require('../utils/db');

const saveTemplate = async (req, res) => {
    try {
        const { name, subject, bodyHtml, isDefault } = req.body;
        const userId = req.user.id;

        if (!name || !subject || !bodyHtml) {
            return res.status(400).json({ message: 'Name, subject, and body are required' });
        }

        // If setting as default, unset others for this user
        if (isDefault) {
            await db.query('UPDATE email_templates SET is_default = FALSE WHERE user_id = $1', [userId]);
        }

        const result = await db.query(
            `INSERT INTO email_templates (user_id, name, subject, body_html, is_default) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, created_at`,
            [userId, name, subject, bodyHtml, isDefault || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Save template error:', err);
        res.status(500).json({ message: 'Failed to save template' });
    }
};

const getTemplates = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT id, name, subject, is_default, created_at FROM email_templates WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get templates error:', err);
        res.status(500).json({ message: 'Failed to fetch templates' });
    }
};

const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            'SELECT * FROM email_templates WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get template error:', err);
        res.status(500).json({ message: 'Failed to fetch template' });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            'DELETE FROM email_templates WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
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
