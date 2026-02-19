const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

const createOAuthClient = () => {
    const oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    return oauth2Client;
};

// Helper to construct raw email message
const makeBody = async (to, from, subject, message, attachments) => {
    // initialize Nodemailer just to build the MIME message
    const mailComposer = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows'
    });

    const mailOptions = {
        to,
        from,
        subject,
        html: message,
        attachments
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

// Helper to determine the client URL
const getClientUrl = () => {
    return process.env.FRONTEND_URL
        ? `https://${process.env.FRONTEND_URL}`
        : 'http://localhost:5173';
};

/**
 * Send an email using Gmail API (HTTPS) or Custom SMTP
 */
const sendEmail = async (to, subject, html, attachments = [], smtpConfig = null) => {
    try {
        // CASE 1: User-Level Gmail OAuth (API - Best for Deliverability)
        if (smtpConfig && smtpConfig.service === 'gmail-api') {
            const userEmail = smtpConfig.user;
            console.log(`[EmailService] Sending email to ${to} via User Gmail API (${userEmail})...`);

            const auth = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            auth.setCredentials({
                refresh_token: smtpConfig.refreshToken,
                access_token: smtpConfig.accessToken
            });

            const gmail = google.gmail({ version: 'v1', auth });

            // Uses user's email as sender
            const rawMessage = await makeBody(to, userEmail, subject, html, attachments);

            const res = await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw: rawMessage }
            });

            console.log('[EmailService] Email sent via User Gmail API:', res.data.id);
            return res.data;
        }

        // CASE 2: Use Custom SMTP (if provided by user)
        if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
            console.log(`[EmailService] Sending email to ${to} via Custom SMTP (${smtpConfig.host})...`);

            const transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: smtpConfig.port || 587,
                secure: smtpConfig.port === 465, // true for 465, false for other ports
                auth: {
                    user: smtpConfig.user,
                    pass: smtpConfig.pass,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            const info = await transporter.sendMail({
                from: `"${smtpConfig.user}" <${smtpConfig.user}>`, // Use custom sender name
                to,
                subject,
                html,
                attachments
            });

            console.log('[EmailService] Email sent via Custom SMTP:', info.messageId);
            return info;
        }

        // CASE 3: Use System Gmail API (HTTPS) - Fallback
        console.log(`[EmailService] Sending email to ${to} via System Gmail API (HTTPS)...`);

        const auth = createOAuthClient();
        const gmail = google.gmail({ version: 'v1', auth });

        // Build the raw email string
        const rawMessage = await makeBody(to, `Pramanit <${process.env.EMAIL_USER}>`, subject, html, attachments);

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage
            }
        });

        console.log('[EmailService] Email sent via API:', res.data.id);
        return res.data;

    } catch (error) {
        console.error('[EmailService] Fatal Error sending email:', error.message);
        // Log more details if available
        if (error.response) {
            console.error('API Error Details:', JSON.stringify(error.response.data));
        }
        throw error;
    }
};

const sendVerificationEmail = async (to, token) => {
    const clientUrl = getClientUrl();
    const verificationUrl = `${clientUrl}/verify-email?token=${token}`;
    const html = `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 32px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.025em; margin: 0;">Pramanit</h1>
    </div>
    
    <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px; tracking-tight: -0.01em;">Verify Your Account</h2>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; font-weight: 500;">
            Welcome to Pramanit! Click the button below to verify your email and unlock full access to your workspace.
        </p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: #ffffff; padding: 16px 40px; border-radius: 16px; font-weight: 800; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
            Verify Email Address
        </a>
    </div>

    <div style="text-align: center; padding-top: 32px; border-top: 1px solid #f1f5f9;">
        <p style="color: #94a3b8; font-size: 12px; font-weight: 600; margin: 0;">
            This link will expire in 24 hours. If you didn't sign up for Pramanit, you can safely ignore this email.
        </p>
    </div>
</div>
`;

    return sendEmail(to, 'Verify your Pramanit Account', html);
};

const sendPasswordResetEmail = async (to, token) => {
    const clientUrl = getClientUrl();
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;
    const html = `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 32px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.025em; margin: 0;">Pramanit</h1>
    </div>
    
    <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Reset Your Password</h2>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; font-weight: 500;">
            We received a request to reset your password. Click the button below to choose a new one.
        </p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: #ffffff; padding: 16px 40px; border-radius: 16px; font-weight: 800; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
            Reset Password
        </a>
    </div>

    <div style="text-align: center; padding-top: 32px; border-top: 1px solid #f1f5f9;">
        <p style="color: #94a3b8; font-size: 12px; font-weight: 600; margin: 0;">
            If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.
        </p>
    </div>
</div>
`;

    return sendEmail(to, 'Password Reset Request - Pramanit', html);
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
