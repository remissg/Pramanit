const Design = require('../models/Design'); // Mongoose Model

const saveDesign = async (req, res) => {
    try {
        const { name, designJson, previewUrl } = req.body;
        const userId = req.user.id; // From middleware

        if (!name || !designJson) {
            return res.status(400).json({ message: 'Name and design data are required' });
        }

        const newDesign = new Design({
            user: userId,
            name,
            design_json: designJson,
            preview_url: previewUrl
        });

        await newDesign.save();

        res.status(201).json({
            id: newDesign._id,
            name: newDesign.name,
            created_at: newDesign.created_at
        });
    } catch (err) {
        console.error('Save design error:', err);
        res.status(500).json({ message: 'Failed to save design' });
    }
};

const getDesigns = async (req, res) => {
    try {
        const userId = req.user.id;
        const designs = await Design.find({ user: userId })
            .select('id name preview_url created_at')
            .sort({ created_at: -1 });

        // Map _id to id for frontend compatibility if needed, though Mongoose usually handles this
        const formattedDesigns = designs.map(d => ({
            id: d._id,
            name: d.name,
            preview_url: d.preview_url,
            created_at: d.created_at
        }));

        res.json(formattedDesigns);
    } catch (err) {
        console.error('Get designs error:', err);
        res.status(500).json({ message: 'Failed to fetch designs' });
    }
};

const getDesignById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const design = await Design.findOne({ _id: id, user: userId });

        if (!design) {
            return res.status(404).json({ message: 'Design not found' });
        }

        res.json({
            id: design._id,
            name: design.name,
            user_id: design.user,
            design_json: design.design_json,
            preview_url: design.preview_url,
            created_at: design.created_at
        });
    } catch (err) {
        console.error('Get design error:', err);
        res.status(500).json({ message: 'Failed to fetch design' });
    }
};

const deleteDesign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const design = await Design.findOneAndDelete({ _id: id, user: userId });

        if (!design) {
            return res.status(404).json({ message: 'Design not found' });
        }

        res.json({ message: 'Design deleted successfully' });
    } catch (err) {
        console.error('Delete design error:', err);
        res.status(500).json({ message: 'Failed to delete design' });
    }
};

const cloneDesign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const original = await Design.findOne({ _id: id, user: userId });

        if (!original) {
            return res.status(404).json({ message: 'Design not found' });
        }

        const newDesign = new Design({
            user: userId,
            name: `${original.name} (Copy)`,
            design_json: original.design_json,
            preview_url: original.preview_url
        });

        await newDesign.save();

        res.status(201).json({
            id: newDesign._id,
            name: newDesign.name,
            created_at: newDesign.created_at
        });
    } catch (err) {
        console.error('Clone design error:', err);
        res.status(500).json({ message: 'Failed to clone design' });
    }
};

module.exports = {
    saveDesign,
    getDesigns,
    getDesignById,
    deleteDesign,
    cloneDesign
};
