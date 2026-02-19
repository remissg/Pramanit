const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// FINAL VERIFIED CREDENTIALS
const GOOGLE_CLIENT_ID = '56342780992-h9na19edtktiem0ubguehofr9obgerjt.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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'; // Verified Correct Secret
const GOOGLE_REFRESH_TOKEN = '1//04CcV6kTAqlWjCgYIARAAGAQSNwF-L9Ir82w9Ec8cLFeqgu-VOKngqVPcQKyLjCXAnUhiirVfvOdrcyTFtVqZMyXk731jk7jkqdQ'; // User Provided
const EMAIL_USER = 'pramanit.official@gmail.com';

const createTransporter = async () => {
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

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: EMAIL_USER,
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                refreshToken: GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        return transporter;
    } catch (error) {
        console.error('Error creating transporter:', error);
        throw error;
    }
};

async function testDelivery() {
    console.log('--- Testing Final Gmail OAuth2 Configuration ---');
    console.log(`Target Recipient: ${EMAIL_USER}`);

    try {
        const transporter = await createTransporter();
        const mailOptions = {
            from: `Pramanit <${EMAIL_USER}>`,
            to: EMAIL_USER,
            subject: 'Pramanit Setup COMPLETE',
            html: '<h1>Success!</h1><p>Your Gmail OAuth2 integration is now fully functional.</p>'
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('\n✅ Email Sent Successfully!');
        console.log('Response ID:', result.messageId);
    } catch (error) {
        console.error('\n❌ Email Sending Failed!');
        console.error('Error Message:', error.message);
    }
}

testDelivery();
