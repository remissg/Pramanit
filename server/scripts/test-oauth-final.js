require('dotenv').config({ path: './.env' }); // Load env from server root
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// CREDENTIALS FROM ENV
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;
const OAuth2 = google.auth.OAuth2;

console.log('Environment Check:');
console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_REFRESH_TOKEN:', GOOGLE_REFRESH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('EMAIL_USER:', EMAIL_USER || '❌ Missing');
console.log('');

// CORRECT SCOPES - use 'email' instead of 'userinfo.email'
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'email'  // Correct scope for user email
];

const makeBody = async (to, from, subject, message) => {
    // initialize Nodemailer just to build the MIME message
    const mailComposer = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows'
    });

    const mailOptions = {
        to,
        from,
        subject,
        html: message
    };

    return new Promise((resolve, reject) => {
        mailComposer.sendMail(mailOptions, (err, info) => {
            if (err) return reject(err);

            // Handle Buffer (Nodemailer 6.x often returns this for streamTransport simple cases)
            if (Buffer.isBuffer(info.message)) {
                return resolve(info.message.toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, ''));
            }

            // Handle Stream
            const stream = info.message;
            if (typeof stream.on === 'function') {
                let buffer = Buffer.alloc(0);
                stream.on('data', (chunk) => {
                    buffer = Buffer.concat([buffer, chunk]);
                });
                stream.on('end', () => {
                    const encoded = buffer.toString('base64')
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=+$/, '');
                    resolve(encoded);
                });
                stream.on('error', (streamErr) => reject(streamErr));
            } else {
                reject(new Error('Unknown info.message type. Expecting Buffer or Stream.'));
            }
        });
    });
};

const sendGmailAPI = async () => {
    try {
        const oauth2Client = new OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: GOOGLE_REFRESH_TOKEN
        });

        console.log('Requesting Access Token...');
        const accessToken = await new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
                if (err) {
                    console.error('Failed to create access token:', err);
                    reject(err);
                }
                resolve(token);
            });
        });
        console.log('✅ Access Token Received!');

        // Use Gmail API like production code
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Build the raw email string
        const rawMessage = await makeBody(EMAIL_USER, `Pramanit <${EMAIL_USER}>`, 'Pramanit Setup COMPLETE', '<h1>Success!</h1><p>Your Gmail OAuth2 integration is now fully functional.</p>');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage
            }
        });

        console.log('\n✅ Email Sent Successfully!');
        console.log('Response ID:', res.data.id);
        return res.data;

    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
};

async function testDelivery() {
    console.log('--- Testing Final Gmail OAuth2 Configuration ---');
    console.log(`Target Recipient: ${EMAIL_USER}`);

    try {
        await sendGmailAPI();
    } catch (error) {
        console.error('\n❌ Email Sending Failed!');
        console.error('Error Message:', error.message);
    }
}

testDelivery();
