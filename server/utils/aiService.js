const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateCertificateContent = async (eventDescription) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

        const prompt = `
            You are an assistant for CertiFlow, a professional certificate issuance platform.
            Based on the following event description, generate three pieces of content:
            1. A professional Certificate Title (short and impactul).
            2. A Certificate Description (1-2 sentences).
            3. A professional Email Body to be sent to recipients along with the certificate. Use {{recipient_name}} as a placeholder for the recipient's name and {{certificate_link}} as a placeholder for the link.

            Event Description: "${eventDescription}"

            Return the response in JSON format like this:
            {
                "title": "...",
                "description": "...",
                "emailBody": "..."
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from the response (sometimes Gemini wraps JSON in code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error("Failed to parse AI response into JSON");
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};

const predictLayout = async (imageBase64) => {
    try {
        // Use gemini-flash-latest for vision-based quick analysis
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
            Analyze this certificate template image. Identify the best locations to place the following fields:
            1. RECIPIENT_NAME
            2. DATE
            3. SIGNATURE

            Professional certificates usually have the NAME in the center, DATE on the bottom left or right, and SIGNATURE on the bottom right or left.
            Look for lines, labels like "This is to certify that", or empty spaces specifically meant for these fields.

            Return the coordinates in JSON format as normalized values (0 to 1) representing the CENTER of each field relative to the image size.
            Output format:
            {
                "name": { "x": 0.5, "y": 0.5 },
                "date": { "x": 0.25, "y": 0.8 },
                "signature": { "x": 0.75, "y": 0.8 }
            }
        `;

        const imagePart = {
            inlineData: {
                data: imageBase64.split(",")[1] || imageBase64,
                mimeType: "image/png" // Assuming PNG/JPEG for templates
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error("Failed to parse AI layout response into JSON");
    } catch (error) {
        console.error("AI Layout Prediction Error:", error);
        throw error;
    }
};

module.exports = { generateCertificateContent, predictLayout };
