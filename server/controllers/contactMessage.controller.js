const ContactMessage = require('../models/ContactMessage');
const Verification = require('../models/Verification');
const { decrypt } = require('../utils/encryption');
const { sendEmail } = require('../utils/emailService');

// Create a message from recipient to issuer
const createContactMessage = async (req, res) => {
    try {
        const { 
            recipient_email, 
            recipient_name, 
            certificate_id, 
            subject, 
            message, 
            message_type 
        } = req.body;

        // Find the verification record to get the issuer
        const verification = await Verification.findOne({ cert_id: certificate_id });
        
        if (!verification) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        // Create the contact message
        const contactMessage = new ContactMessage({
            recipient_email,
            recipient_name,
            certificate_id,
            issuer: verification.issuer_id,
            subject,
            message,
            message_type: message_type || 'general_inquiry'
        });

        await contactMessage.save();

        // Send notification email to issuer
        const issuerUser = await require('../models/User').findById(verification.issuer_id);
        
        if (issuerUser && issuerUser.email) {
            const notificationHtml = `
                <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="font-size: 32px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.025em; margin: 0;">Pramanit</h1>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Certificate Inquiry</h2>
                        <p style="color: #64748b; font-size: 16px; line-height: 1.6; font-weight: 500;">
                            A certificate recipient has contacted you regarding their certificate.
                        </p>
                    </div>

                    <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
                        <h3 style="color: #1e293b; font-size: 18px; margin-bottom: 16px;">Message Details:</h3>
                        <p><strong>From:</strong> ${recipient_name} (${recipient_email})</p>
                        <p><strong>Certificate ID:</strong> ${certificate_id}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #7c3aed;">
                            ${message}
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <p style="color: #64748b; font-size: 14px;">
                            Please log in to your Pramanit dashboard to respond to this message.
                        </p>
                    </div>
                </div>
            `;

            try {
                await sendEmail(
                    issuerUser.email,
                    `Certificate Inquiry: ${subject}`,
                    notificationHtml
                );
            } catch (emailError) {
                console.error('Failed to notify issuer:', emailError);
            }
        }

        res.status(201).json({
            message: 'Your message has been sent to the certificate issuer.',
            contactMessage: {
                id: contactMessage._id,
                subject: contactMessage.subject,
                status: contactMessage.status,
                created_at: contactMessage.created_at
            }
        });

    } catch (error) {
        console.error('Create contact message error:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

// Get all messages for an issuer
const getIssuerMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const messages = await ContactMessage.find({ issuer: userId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ContactMessage.countDocuments({ issuer: userId });

        // Decrypt recipient emails for display
        const decryptedMessages = messages.map(msg => ({
            ...msg.toObject(),
            recipient_email: decrypt(msg.recipient_email)
        }));

        res.json({
            messages: decryptedMessages,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            }
        });
    } catch (error) {
        console.error('Get issuer messages error:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

// Respond to a message
const respondToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const userId = req.user.id;

        const message = await ContactMessage.findOne({ _id: id, issuer: userId });
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Update message with response
        message.issuer_response = response;
        message.responded_at = new Date();
        message.status = 'responded';
        
        await message.save();

        // Send response email to recipient
        const responseHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Response to Your Inquiry - Pramanit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 36px 40px 24px 40px; text-align: center; background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%); border-b: 1px solid #f1f5f9;">
                            <div style="font-size: 26px; font-weight: 900; color: #059669; letter-spacing: -0.5px; line-height: 1;">💬 Pramanit Support</div>
                            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 2px;">Issuer Direct Response</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #0f172a; text-align: center; letter-spacing: -0.5px;">Response to Your Inquiry</h1>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center; font-weight: 500;">
                                The credential issuing authority has reviewed your message regarding Certificate ID <strong style="color: #6d28d9; font-family: monospace;">${message.certificate_id}</strong>.
                            </p>

                            <!-- Original Inquiry Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px 20px; margin-bottom: 20px;">
                                <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Original Inquiry</p>
                                <p style="margin: 0; font-size: 13px; color: #334155; font-weight: 600;">"${message.subject}"</p>
                            </div>

                            <!-- Issuer Official Response Card -->
                            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-top: 1px solid #d1fae5; border-right: 1px solid #d1fae5; border-bottom: 1px solid #d1fae5; border-radius: 0 16px 16px 0; padding: 20px; margin-bottom: 24px;">
                                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 900; color: #047857; text-transform: uppercase; letter-spacing: 1.5px;">Official Response from Issuer</p>
                                <div style="font-size: 14px; line-height: 1.7; color: #064e3b; font-weight: 500;">
                                    ${response}
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                Verified Credential Dispatch Node &bull; Pramanit Identity Network
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

        try {
            await sendEmail(
                decrypt(message.recipient_email),
                `Response: ${message.subject}`,
                responseHtml
            );
        } catch (emailError) {
            console.error('Failed to send response email:', emailError);
        }

        res.json({
            message: 'Response sent successfully',
            message: {
                ...message.toObject(),
                recipient_email: decrypt(message.recipient_email)
            }
        });

    } catch (error) {
        console.error('Respond to message error:', error);
        res.status(500).json({ message: 'Failed to send response' });
    }
};

module.exports = {
    createContactMessage,
    getIssuerMessages,
    respondToMessage
};
