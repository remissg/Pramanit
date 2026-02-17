const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    console.log("Testing gemini-flash-latest...");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("ping");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error) {
        console.error("Failed:", error.message);
    }
}

test();
