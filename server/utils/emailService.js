const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with the provided API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to determine the client URL
const getClientUrl = () => {
    return process.env.FRONTEND_URL
        ? `https://${process.env.FRONTEND_URL}`
        : 'http://localhost:5173';
};

/**
 * Send an email using Resend API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @param {Array} attachments - Array of attachment objects { filename, content }
 * @param {Object} customSmtp - Ignored now (formerly for custom SMTP)
 */
const sendEmail = async (to, subject, html, attachments, customSmtp) => {
    try {
        console.log(`[EmailService] Sending email to ${to} via Resend...`);

        // If attachments have Buffer content, Resend expects them as-is, which is compatible.
        // We ensure attachments are formatted correctly.
        const formattedAttachments = attachments ? attachments.map(att => ({
            filename: att.filename,
            content: att.content // Buffer
        })) : [];

        const data = await resend.emails.send({
            from: 'Pramanit <onboarding@resend.dev>', // Default sender for testing
            to: [to],
            subject: subject,
            html: html,
            attachments: formattedAttachments
        });

        if (data.error) {
            console.error('[EmailService] Resend API Error:', data.error);
            throw new Error(data.error.message);
        }

        console.log(`[EmailService] Email sent successfully. ID: ${data.data?.id || data.id}`);
        return data;

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
