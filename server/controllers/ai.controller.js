const aiService = require('../utils/aiService');

const generateContent = async (req, res) => {
    try {
        const { eventDescription } = req.body;
        const content = await aiService.generateCertificateContent(eventDescription);
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: "AI Content Generation Failed", error: error.message });
    }
};

const predictLayout = async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        console.log("AI Layout Prediction Request Received");
        if (!imageBase64) return res.status(400).json({ message: "Image base64 is required" });

        const layout = await aiService.predictLayout(imageBase64);
        console.log("AI Layout Prediction Success:", layout);
        res.json(layout);
    } catch (error) {
        console.error("AI Layout Prediction CRITICAL FAILURE:", error);
        res.status(500).json({
            message: "AI Layout Prediction Failed",
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
};

module.exports = { generateContent, predictLayout };
