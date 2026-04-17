require('dotenv').config({ path: './.env' });
const { google } = require('googleapis');

console.log('🔧 Simple OAuth Refresh Token Generator');
console.log('=====================================\n');

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Use OAuth playground redirect
);

// CORRECT SCOPES
const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'email'
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force refresh token generation
});

console.log('📋 STEPS TO GENERATE NEW REFRESH TOKEN:');
console.log('=====================================\n');
console.log('1️⃣  Open this URL in your browser:');
console.log(authUrl);
console.log('\n2️⃣  Sign in with your Google account');
console.log('3️⃣  Grant permissions for Gmail sending and email access');
console.log('4️⃣  You will be redirected to a page with "Authorization code"');
console.log('5️⃣  Copy that authorization code\n');

console.log('🔗 AUTH URL (click to open):');
console.log(authUrl);
console.log('\n⚠️  IMPORTANT: Make sure you use "prompt: consent" to get a refresh token!');

// Provide instructions for manual token exchange
console.log('\n📝 MANUAL TOKEN EXCHANGE:');
console.log('==========================');
console.log('After getting the authorization code, use this curl command:');
console.log(`curl -X POST "https://oauth2.googleapis.com/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "code=YOUR_AUTH_CODE_HERE&client_id=${GOOGLE_CLIENT_ID}&client_secret=${GOOGLE_CLIENT_SECRET}&redirect_uri=https://developers.google.com/oauthplayground&grant_type=authorization_code"`);

console.log('\n🔄 ALTERNATIVE: Use OAuth Playground:');
console.log('=====================================');
console.log('1. Go to: https://developers.google.com/oauthplayground');
console.log('2. Click Settings (gear icon)');
console.log('3. Check "Use your own OAuth credentials"');
console.log(`4. Enter:
   Client ID: ${GOOGLE_CLIENT_ID}
   Client Secret: ${GOOGLE_CLIENT_SECRET}`);
console.log('5. In left panel, select scopes:');
console.log('   - https://www.googleapis.com/auth/gmail.send');
console.log('   - email');
console.log('6. Click "Authorize APIs"');
console.log('7. Complete Google sign-in');
console.log('8. Click "Exchange authorization code for tokens"');
console.log('9. Copy the Refresh Token and update your .env file');
