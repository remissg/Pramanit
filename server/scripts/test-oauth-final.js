require('dotenv').config({ path: '../.env' }); // Load env from server root

// CREDENTIALS FROM ENV
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;

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
