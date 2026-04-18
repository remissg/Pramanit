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
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 32px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.025em; margin: 0;">Pramanit</h1>
                </div>
                
                <div style="text-align: center; margin-bottom: 32px;">
                    <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Response to Your Inquiry</h2>
                    <p style="color: #64748b; font-size: 16px; line-height: 1.6; font-weight: 500;">
                        The certificate issuer has responded to your message.
                    </p>
                </div>

                <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
                    <h3 style="color: #1e293b; font-size: 18px; margin-bottom: 16px;">Issuer Response:</h3>
                    <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
                        ${response}
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 32px;">
                    <p style="color: #64748b; font-size: 14px;">
                        Certificate ID: ${message.certificate_id}
                    </p>
                </div>
            </div>
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
