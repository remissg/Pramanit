const nodemailer = require('nodemailer');
const cryptoUtils = require('./cryptoUtils');

const transporterCache = new Map();

const sendEmail = async (to, subject, html, attachments, customSmtp = null) => {
    try {
        let transporter;
        const cacheKey = customSmtp ? JSON.stringify(customSmtp) : 'default';

        if (transporterCache.has(cacheKey)) {
            transporter = transporterCache.get(cacheKey);
        } else {
            let transporterConfig;

            if (customSmtp && customSmtp.host && customSmtp.user && customSmtp.pass) {
                // Decrypt the custom SMTP password
                const decryptedPass = cryptoUtils.decrypt(customSmtp.pass);
                const port = Number(customSmtp.port) || 587;

                transporterConfig = {
                    host: customSmtp.host,
                    port: port,
                    secure: port === 465, // True for 465, false for other ports
                    auth: {
                        user: customSmtp.user,
                        pass: decryptedPass || customSmtp.pass,
                    },
                    family: 4, // Force IPv4
                    pool: true, // Enable pooling
                    maxConnections: 5,
                    maxMessages: 100,
                    connectionTimeout: 60000, // Increased timeout 
                    greetingTimeout: 30000,
                    socketTimeout: 60000, // Increased timeout
                };
            } else {
                // For Gmail default, use port 587 (STARTTLS) which is often more reliable than 465 on Render/IPv6
                transporterConfig = {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // Use STARTTLS
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                    family: 4, // Force IPv4 - strictly respected when not using 'service'
                    pool: true,
                    maxConnections: 5,
                    maxMessages: 100,
                    connectionTimeout: 60000, // Increased timeout
                    greetingTimeout: 30000,
                    socketTimeout: 60000, // Increased timeout
                };
            }
            console.log(`[EmailService] Creating transporter for ${customSmtp ? customSmtp.host : 'smtp.gmail.com'} on port ${transporterConfig.port}`);
            transporter = nodemailer.createTransport(transporterConfig);

            // Verify connection configuration
            try {
                await transporter.verify();
                console.log('[EmailService] Transporter verification successful');
            } catch (verifyError) {
                console.error('[EmailService] Transporter verification failed:', verifyError);
                // Don't throw here, let sendMail try and fail with specific error if needed, or maybe better to fail early?
                // Actually, if verify fails, sendMail will definitely fail. Let's log it clearly.
            }

            transporterCache.set(cacheKey, transporter);
        }

        const mailOptions = {
            from: customSmtp?.user ? customSmtp.user : `"Pramanit" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text: html.replace(/<[^>]*>?/gm, ''), // Fallback plain text
            attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + (info.response || 'success'));
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const getClientUrl = () => {
    return process.env.FRONTEND_URL
        ? `https://${process.env.FRONTEND_URL}`
        : 'http://localhost:5173';
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
