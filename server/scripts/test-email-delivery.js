const { sendEmail } = require('../utils/emailService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Default to the sender itself for testing
const testRecipient = 'maitijoydip888@gmail.com'; // User requested test

async function testDelivery() {
    console.log('--- Testing Email Delivery via Gmail OAuth2 ---');
    console.log(`Target Recipient: ${testRecipient}`);

    // Check for required env vars
    const missing = [];
    if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
    if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
    if (!process.env.GOOGLE_REFRESH_TOKEN) missing.push('GOOGLE_REFRESH_TOKEN');
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');

    if (missing.length > 0) {
        console.error('❌ ERROR: Missing Environment Variables for OAuth2:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('Please update your .env file with the credentials provided.');
        return;
    }

    console.log('✅ Found OAuth2 Credentials in environment.');

    try {
        const html = '<h1>Test Email from Pramanit (Gmail OAuth2)</h1><p>If you see this, the Gmail API integration is working perfectly!</p>';
        const result = await sendEmail(testRecipient, 'Gmail API Integration Test', html, []);
        console.log('\n✅ Email Sent Successfully via Gmail API!');
        console.log('Response:', result);
    } catch (error) {
        console.error('\n❌ Email Sending Failed!');
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
    }
}

testDelivery();
