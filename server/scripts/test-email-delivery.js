const { sendEmail } = require('../utils/emailService');
require('dotenv').config();

const testRecipient = process.env.EMAIL_USER || 'pramanit.official@gmail.com';

async function testDelivery() {
    console.log('--- Testing Email Delivery via Resend ---');
    console.log(`Target Recipient: ${testRecipient}`);
    console.log(`API Key Loaded: ${process.env.RESEND_API_KEY ? 'Yes' : 'No'}`);

    try {
        const html = '<h1>Test Email from Pramanit</h1><p>If you see this, Resend is working correctly!</p>';
        const result = await sendEmail(testRecipient, 'Resend Integration Test', html, []);
        console.log('\n✅ Email Sent Successfully!');
        console.log('Response:', result);
    } catch (error) {
        console.error('\n❌ Email Sending Failed!');
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);

        if (error.message && error.message.includes('only send to your own email')) {
            console.log('\n⚠️ EXPLANATION: On the Resend Free Tier, you can ONLY send emails to the address you signed up with.');
            console.log('   You are likely trying to send to a different address.');
        }
    }
}

testDelivery();
