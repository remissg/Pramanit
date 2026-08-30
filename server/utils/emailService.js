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

    // Handle token refresh errors
    oauth2Client.on('tokens', (tokens) => {
        if (tokens.refresh_token) {
            console.log('New refresh token received - update your environment variables');
            // In production, you might want to store this securely
        }
    });

    return oauth2Client;
};

// Helper to construct raw email message
const makeBody = async (to, from, subject, message, attachments, replyTo = null) => {
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
        attachments,
        ...(replyTo ? { replyTo } : {})
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
const sendEmail = async (to, subject, html, attachments = [], smtpConfig = null, replyTo = null) => {
    try {
        const effectiveReplyTo = replyTo || (smtpConfig && smtpConfig.user ? smtpConfig.user : null);

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

            try {
                // Uses user's email as sender
                const rawMessage = await makeBody(to, userEmail, subject, html, attachments, effectiveReplyTo);

                const res = await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: { raw: rawMessage }
                });

                console.log('[EmailService] Email sent via User Gmail API:', res.data.id);
                return res.data;
            } catch (apiError) {
                if (apiError.code === 400 && apiError.message.includes('invalid_grant')) {
                    console.error('[EmailService] User refresh token invalid/revoked. User needs to reconnect Gmail.');
                    throw new Error('GMAIL_TOKEN_EXPIRED: Please reconnect your Gmail account');
                }
                throw apiError;
            }
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

            const mailOpts = {
                from: `"${smtpConfig.user}" <${smtpConfig.user}>`, // Use custom sender name
                to,
                subject,
                html,
                attachments
            };

            if (effectiveReplyTo) {
                mailOpts.replyTo = effectiveReplyTo;
            }

            const info = await transporter.sendMail(mailOpts);

            console.log('[EmailService] Email sent via Custom SMTP:', info.messageId);
            return info;
        }

        // CASE 3: Use System Gmail API (HTTPS) - Fallback
        console.log(`[EmailService] Sending email to ${to} via System Gmail API (HTTPS)...`);

        const auth = createOAuthClient();
        const gmail = google.gmail({ version: 'v1', auth });

        // Build the raw email string
        const rawMessage = await makeBody(to, `Pramanit <${process.env.EMAIL_USER}>`, subject, html, attachments, effectiveReplyTo);

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
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Pramanit Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 36px 40px 24px 40px; text-align: center; background: linear-gradient(180deg, #f3e8ff 0%, #ffffff 100%); border-b: 1px solid #f1f5f9;">
                            <div style="font-size: 26px; font-weight: 900; color: #6d28d9; letter-spacing: -0.5px; line-height: 1;">🛡️ Pramanit</div>
                            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px;">Accredited Credential Network</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Verify Your Account</h1>
                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #475569; font-weight: 500;">
                                Welcome to Pramanit! Please verify your email address to unlock full access to your institutional issuer workspace and credential vaults.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 28px auto;">
                                <tr>
                                    <td align="center" style="border-radius: 16px; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); box-shadow: 0 8px 16px -4px rgba(124, 58, 237, 0.3);">
                                        <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 13px; font-weight: 900; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                                            Verify Email Address &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                Button not working? Copy and paste this link in your browser:<br>
                                <a href="${verificationUrl}" style="color: #6d28d9; word-break: break-all; font-family: monospace; font-size: 11px; font-weight: 600;">${verificationUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Expiration Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                ⏳ This verification link expires in <strong style="color: #475569;">24 hours</strong>.<br>
                                If you didn't create an account with Pramanit, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    return sendEmail(to, 'Verify your Pramanit Account', html);
};

const sendPasswordResetEmail = async (to, token) => {
    const clientUrl = getClientUrl();
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Pramanit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 36px 40px 24px 40px; text-align: center; background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%); border-b: 1px solid #f1f5f9;">
                            <div style="font-size: 26px; font-weight: 900; color: #dc2626; letter-spacing: -0.5px; line-height: 1;">🔒 Pramanit</div>
                            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 2px;">Security & Account Access</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Password Reset Request</h1>
                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #475569; font-weight: 500;">
                                We received a request to reset the password for your Pramanit account. Click the button below to choose a new password securely.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 28px auto;">
                                <tr>
                                    <td align="center" style="border-radius: 16px; background: linear-gradient(135deg, #dc2626 0%, #7c3aed 100%); box-shadow: 0 8px 16px -4px rgba(220, 38, 38, 0.3);">
                                        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 13px; font-weight: 900; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                                            Choose New Password &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                Link not opening? Copy and paste into your browser:<br>
                                <a href="${resetUrl}" style="color: #dc2626; word-break: break-all; font-family: monospace; font-size: 11px; font-weight: 600;">${resetUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Expiration Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                ⏳ This reset link will expire in <strong style="color: #dc2626;">1 hour</strong>.<br>
                                If you did not request a password reset, please ignore this message. Your password will remain unchanged.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    return sendEmail(to, 'Password Reset Request - Pramanit', html);
};

const sendAdminVerificationAlert = async (userData) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'joydipmaiti.dev@gmail.com';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const subject = `🚨 Action Required: New Issuer Verification Submitted (${userData.org_name || userData.email})`;
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #e2e8f0;">
                    <tr>
                        <td style="padding: 32px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); text-align: center; color: white;">
                            <h2 style="margin:0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">🚨 New Issuer Verification Submitted</h2>
                            <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 600;">Profile Submitted — Pending Immediate Admin Review</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 13px; color: #334155; border-collapse: collapse;">
                                <tr>
                                    <td width="40%" style="font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px;">Issuer Email:</td>
                                    <td style="font-weight: 700; color: #0f172a;">${userData.email}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px;">Account Category:</td>
                                    <td style="font-weight: 700; color: #7c3aed;">${userData.verification_category || userData.issuer_type || 'Official Institution'}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px;">Organization / Dept:</td>
                                    <td style="font-weight: 700; color: #0f172a;">${userData.org_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px;">Parent Institution:</td>
                                    <td style="font-weight: 700; color: #0f172a;">${userData.institution_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px;">Authorized Signer:</td>
                                    <td style="font-weight: 700; color: #0f172a;">${userData.full_name || 'N/A'} (${userData.designation || 'N/A'})</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px;">Registration / Roll ID:</td>
                                    <td style="font-weight: 700; color: #0f172a;">${userData.institution_id_number || 'N/A'}</td>
                                </tr>
                                ${userData.official_id_url ? `
                                <tr>
                                    <td style="font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px;">Uploaded Identity File:</td>
                                    <td><a href="${userData.official_id_url}" target="_blank" style="color: #7c3aed; font-weight: 800; text-decoration: underline;">🔍 Preview Document</a></td>
                                </tr>
                                ` : ''}
                            </table>

                            <div style="margin-top: 28px; text-align: center;">
                                <a href="${frontendUrl}/admin" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 12px; font-weight: 900; color: #ffffff; background: #7c3aed; text-decoration: none; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
                                    Open Admin Console & Review Issuer &rarr;
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

        await sendEmail(adminEmail, subject, html);
        console.log(`Admin verification notification email sent for user: ${userData.email}`);
    } catch (err) {
        console.error('Failed to send admin verification notification email:', err);
    }
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendAdminVerificationAlert };
