const db = require('../utils/db');

const saveDesign = async (req, res) => {
    try {
        const { name, designJson, previewUrl } = req.body;
        const userId = req.user.id; // From middleware

        if (!name || !designJson) {
            return res.status(400).json({ message: 'Name and design data are required' });
        }

        const result = await db.query(
            `INSERT INTO designs (user_id, name, design_json, preview_url) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, created_at`,
            [userId, name, designJson, previewUrl]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Save design error:', err);
        res.status(500).json({ message: 'Failed to save design' });
    }
};

const getDesigns = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT id, name, preview_url, created_at FROM designs WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get designs error:', err);
        res.status(500).json({ message: 'Failed to fetch designs' });
    }
};

const getDesignById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            'SELECT * FROM designs WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Design not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get design error:', err);
        res.status(500).json({ message: 'Failed to fetch design' });
    }
};

const deleteDesign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            'DELETE FROM designs WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Design not found' });
        }

        res.json({ message: 'Design deleted successfully' });
    } catch (err) {
        console.error('Delete design error:', err);
        res.status(500).json({ message: 'Failed to delete design' });
    }
};

module.exports = {
    saveDesign,
    getDesigns,
    getDesignById,
    deleteDesign
};
