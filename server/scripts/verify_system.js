const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');
const nodemailer = require('nodemailer');
const csv = require('csv-parser');

// Mock Environment
process.env.MONGODB_URI = 'mongodb://localhost:27017/certiflow_test';

const LOG_PREFIX = '[System Verify]';

const log = (msg, type = 'info') => {
    const symbols = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
    console.log(`${symbols[type]} ${LOG_PREFIX} ${msg}`);
};

const runVerification = async () => {
    console.log('\n--- Starting System Verification ---\n');

    // 1. CSV Parsing Verification
    await verifyCsvParsing();

    // 2. Image Generation Verification (Canvas)
    await verifyImageGeneration();

    // 3. Email Config Verification
    await verifyEmailConfig();

    console.log('\n--- Verification Complete ---\n');
};

const verifyCsvParsing = async () => {
    log('Testing CSV Parsing...', 'info');
    const csvContent = 'name,email,course\nJohn Doe,john@example.com,React Basics\nJane Smith,jane@example.com,Node Advanced';
    const tempCsvPath = path.join(__dirname, 'temp_test.csv');

    try {
        fs.writeFileSync(tempCsvPath, csvContent);
        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(tempCsvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        if (results.length === 2 && results[0].name === 'John Doe') {
            log('CSV Parsing Passed', 'success');
        } else {
            log('CSV Parsing Failed: Incorrect data length or content', 'error');
        }
    } catch (error) {
        log(`CSV Parsing Error: ${error.message}`, 'error');
    } finally {
        if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    }
};

const verifyImageGeneration = async () => {
    log('Testing Image Generation (Canvas)...', 'info');
    try {
        const width = 800;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);

        // Draw Text with special characters
        ctx.fillStyle = '#000000';
        ctx.font = '30px Arial';
        ctx.fillText('CertiFlow Test: @#$%^&*()_+', 50, 100);

        const buffer = canvas.toBuffer('image/png');
        if (buffer && buffer.length > 0) {
            log('Image Generation Passed (Buffer created)', 'success');
        } else {
            log('Image Generation Failed (Empty buffer)', 'error');
        }
    } catch (error) {
        log(`Image Generation Error: ${error.message}`, 'error');
    }
};

const verifyEmailConfig = async () => {
    log('Testing Email Transport Config...', 'info');
    // We'll test with a mock ethereal account or just verify the transporter creation
    // For this test, we mimic the logic in emailService.js but without sending real mail if no config

    try {
        // Create a test account if no env vars (simulating a clean dev env)
        const testAccount = await nodemailer.createTestAccount();

        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        await transporter.verify();
        log('Email Transport Verification Passed (Ethereal Mock)', 'success');

    } catch (error) {
        log(`Email Verification Error: ${error.message}`, 'error');
    }
};

runVerification();
