const { createCanvas, loadImage } = require('canvas');
const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../utils/emailService');

dotenv.config();

// MOCK WORKER DATA
const workerData = {
    recipients: [
        { name: 'Test User', email: 'pramanit.official@gmail.com', data: { Course: 'Debugging 101' } }
    ],
    designConfig: {
        templatePath: path.join(__dirname, '../assets/test-template.png'), // Will create dummy if needed
        fields: [
            { id: 'name', x: 0.5, y: 0.5, fontSize: 40, isVisible: true, color: '#000000' }
        ],
        qrConfig: { isVisible: false },
        subject: 'Worker Logic Test',
        emailBody: 'This is a test from the simulated worker script.'
    },
    branding: {
        _id: new mongoose.Types.ObjectId(),
        org_name: 'Debug Org',
        full_name: 'Debug Admin',
        email: 'pramanit.official@gmail.com'
    },
    mongoUri: process.env.MONGODB_URI
};

const logFunc = (msg) => {
    try {
        const logPath = path.join(__dirname, '../worker_simulation.log');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
        console.log(`[LOG] ${msg}`);
    } catch (e) {
        console.error('LogFunc Error:', e);
    }
};

const processBatch = async () => {
    console.log('--- Starting Worker Logic Simulation ---');
    const { recipients, designConfig, branding } = workerData;

    // Create dummy template if missing
    if (!fs.existsSync(designConfig.templatePath)) {
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);
        const buffer = canvas.toBuffer('image/png');

        // Ensure assets dir exists
        const assetsDir = path.dirname(designConfig.templatePath);
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        fs.writeFileSync(designConfig.templatePath, buffer);
        console.log('Created dummy template.');
    }

    try {
        const templateImage = await loadImage(designConfig.templatePath);
        const scaleFactor = templateImage.width / 800;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            // SIMULATE CANVAS WORK
            const canvas = createCanvas(templateImage.width, templateImage.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(templateImage, 0, 0);

            // SIMULATE EMAIL
            if (recipient.email) {
                logFunc(`Sending email to ${recipient.email}...`);
                try {
                    await sendEmail(
                        recipient.email,
                        designConfig.subject,
                        designConfig.emailBody,
                        []
                    );
                    logFunc(`Email sent to ${recipient.email}`);
                } catch (emailErr) {
                    logFunc(`Email FAILED for ${recipient.email}: ${emailErr.message}`);
                    console.error(emailErr);
                }
            }
        }
    } catch (error) {
        console.error('Simulation Failed:', error);
    }
};

processBatch();
