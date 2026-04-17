require('dotenv').config({ path: './.env' });
const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/callback' // This will be handled manually
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

console.log('🔗 Generate New Refresh Token');
console.log('================================');
console.log('\n1. Open this URL in your browser:');
console.log(authUrl);
console.log('\n2. Authorize the application');
console.log('3. Copy the authorization code from the callback URL');
console.log('4. Paste it below when prompted\n');

rl.question('Enter the authorization code: ', async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);

        console.log('\n✅ Success! Here are your tokens:');
        console.log('==================================');
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('Expires In:', tokens.expiry_date ? new Date(tokens.expiry_date) : 'N/A');

        console.log('\n📝 Update your .env file with:');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

        if (tokens.refresh_token) {
            console.log('\n✅ Refresh token received successfully!');
        } else {
            console.log('\n⚠️  No refresh token received. Make sure you used "prompt: consent"');
        }

    } catch (error) {
        console.error('❌ Error exchanging code for tokens:', error.message);
    }

    rl.close();
});
