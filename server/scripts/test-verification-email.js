require('dotenv').config({ path: './.env' });
const { sendVerificationEmail } = require('../utils/emailService');

async function testVerificationEmail() {
    console.log('--- Testing Verification Email ---');
    
    const testEmail = process.env.EMAIL_USER || 'pramanit.official@gmail.com';
    const testToken = 'test-verification-token-123456';
    
    console.log(`Sending verification email to: ${testEmail}`);
    console.log(`Using token: ${testToken}`);
    
    try {
        const result = await sendVerificationEmail(testEmail, testToken);
        console.log('\n✅ Verification email sent successfully!');
        console.log('Result:', result);
    } catch (error) {
        console.error('\n❌ Verification email failed!');
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
        
        // Check for specific error types
        if (error.code === 400 && error.message.includes('invalid_grant')) {
            console.error('\n🔧 OAuth Token Issue: Refresh token expired/invalid');
            console.error('Solution: Regenerate refresh token using OAuth Playground');
        } else if (error.code === 403) {
            console.error('\n🔧 Permission Issue: Insufficient Gmail permissions');
            console.error('Solution: Reconnect Gmail account with correct scopes');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('\n🔧 Network Issue: Connection timeout');
            console.error('Solution: Check network connection');
        }
    }
}

testVerificationEmail();
