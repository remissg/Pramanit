const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log("Fetching available models from Google API...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const res = await axios.get(url);
        console.log("Available Models:");
        res.data.models.forEach(m => {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error("Listing Error:", error.response?.data || error.message);
    }
}

listModels();
