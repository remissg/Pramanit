const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const dns = require('dns');
require('dotenv').config();

// Force IPv4 to prevent Gmail SMTP hangs
try {
    dns.setDefaultResultOrder('ipv4first');
} catch (e) {
    console.warn('Could not set default result order for DNS:', e.message);
}

const OAuth2 = google.auth.OAuth2;

// Initialize OAuth2 Client (Singleton)
let transporter = null;

const createTransporter = async () => {
    if (transporter) return transporter;

    try {
        const oauth2Client = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground" // Redirect URL
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // Get Access Token
        const accessToken = await new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
                if (err) {
                    console.error('[EmailService] Failed to create access token:', err);
                    // Rejecting here might stop the whole flow, maybe try without token?
                    // Actually, Gmail OAuth needs it.
                    reject(err);
                }
                resolve(token);
            });
        });

        // Create standard transporter with forced IPv4 socket
        transporter = nodemailer.createTransport({
            service: 'gmail', // This sets host: smtp.gmail.com, port: 465, secure: true by default
            host: 'smtp.gmail.com',
            port: 587, // Explicitly use 587 (STARTTLS)
            secure: false, // Must be false for 587
            requireTLS: true,
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken
            },
            tls: {
                rejectUnauthorized: false
            },
            // Force IPv4 at the socket level - simpler and more robust than manual DNS
            socketTimeout: 30000,
            greetingTimeout: 10000, // Slightly longer greeting timeout
            connectionTimeout: 10000,
            family: 4 // Use IPv4 only
        });

        // Verify connection configuration
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    console.error('[EmailService] Transporter verification failed:', error);
                    transporter = null; // Reset if failed
                    reject(error);
                } else {
                    console.log("[EmailService] Server is ready to take our messages");
                    resolve(success);
                }
            });
        });

        return transporter;
    } catch (error) {
        console.error('[EmailService] Error creating transporter:', error);
        throw error;
    }
};

// Helper to determine the client URL
const getClientUrl = () => {
    return process.env.FRONTEND_URL
        ? `https://${process.env.FRONTEND_URL}`
        : 'http://localhost:5173';
};

/**
 * Send an email using Gmail OAuth2
 */
const sendEmail = async (to, subject, html, attachments, customSmtp) => {
    try {
        console.log(`[EmailService] Sending email to ${to} via Gmail OAuth2...`);

        const transporter = await createTransporter();

        const mailOptions = {
            from: `Pramanit <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('[EmailService] Email sent successfully:', result.response);
        return result;

    } catch (error) {
        console.error('[EmailService] Fatal Error sending email:', error.message);
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
