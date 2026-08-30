const Verification = require('../models/Verification');
const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');
const { decrypt } = require('../utils/encryption');
const { sendEmail } = require('../utils/emailService');
const { sendCertificateEmail } = require('../utils/enhancedEmailService');
const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Get all correction requests for issuer dashboard
const getCorrectionRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Find all verifications with correction requests for this issuer
        const corrections = await Verification.find({ 
            issuer_id: userId,
            correction_requested: true
        })
        .select('cert_id recipient_name recipient_email correction_status requested_name issue_date certificate_title')
        .sort({ issue_date: -1 })
        .skip(skip)
        .limit(limit);

        const total = await Verification.countDocuments({ 
            issuer_id: userId,
            correction_requested: true 
        });

        // Decrypt recipient emails
        const decryptedCorrections = corrections.map(cert => ({
            ...cert.toObject(),
            recipient_email: cert.recipient_email ? decrypt(cert.recipient_email) : null
        }));

        // Get associated contact messages
        const certIds = corrections.map(c => c.cert_id);
        const contactMessages = await ContactMessage.find({
            certificate_id: { $in: certIds },
            message_type: { $in: ['name_correction', 'certificate_issue'] }
        }).sort({ created_at: -1 });

        // Merge contact messages with corrections
        const correctionsWithMessages = decryptedCorrections.map(cert => ({
            ...cert,
            contact_message: contactMessages.find(msg => msg.certificate_id === cert.cert_id)
        }));

        res.json({
            corrections: correctionsWithMessages,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            }
        });
    } catch (error) {
        console.error('Get correction requests error:', error);
        res.status(500).json({ message: 'Failed to fetch correction requests' });
    }
};

// Submit a correction request (from recipient)
const submitCorrectionRequest = async (req, res) => {
    try {
        const { certificate_id, requested_name, reason, recipient_email, recipient_name } = req.body;

        // Find the certificate
        const verification = await Verification.findOne({ cert_id: certificate_id });
        
        if (!verification) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        // Update verification with correction request
        verification.correction_requested = true;
        verification.requested_name = requested_name;
        verification.correction_status = 'pending';
        await verification.save();

        // Create a contact message for tracking
        const contactMessage = new ContactMessage({
            recipient_email,
            recipient_name,
            certificate_id,
            issuer: verification.issuer_id,
            subject: `Name Correction Request: ${requested_name}`,
            message: reason || `Request to change name to: ${requested_name}`,
            message_type: 'name_correction'
        });
        await contactMessage.save();

        // Notify issuer
        const issuerUser = await User.findById(verification.issuer_id);
        if (issuerUser && issuerUser.email) {
            const notificationHtml = `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
                    <h2 style="color: #1e293b;">Certificate Correction Request</h2>
                    <p>A recipient has requested a correction for their certificate.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <p><strong>Certificate ID:</strong> ${certificate_id}</p>
                        <p><strong>Current Name:</strong> ${verification.recipient_name}</p>
                        <p><strong>Requested Name:</strong> ${requested_name}</p>
                        <p><strong>Reason:</strong> ${reason || 'Not provided'}</p>
                    </div>
                    
                    <p>Please log in to your dashboard to approve or reject this request.</p>
                </div>
            `;
            
            await sendEmail(
                issuerUser.email,
                'Certificate Correction Request',
                notificationHtml
            );
        }

        res.status(201).json({
            message: 'Correction request submitted successfully',
            request: {
                certificate_id,
                status: 'pending',
                requested_name
            }
        });
    } catch (error) {
        console.error('Submit correction request error:', error);
        res.status(500).json({ message: 'Failed to submit correction request' });
    }
};

// Process correction - Create NEW certificate (recommended approach)
const processCorrection = async (req, res) => {
    try {
        const { certificate_id, action, corrected_data } = req.body;
        const userId = req.user.id;

        // Find the original certificate
        const originalCert = await Verification.findOne({ 
            cert_id: certificate_id,
            issuer_id: userId 
        });

        if (!originalCert) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        if (action === 'reject') {
            // Reject the correction request
            originalCert.correction_status = 'rejected';
            originalCert.correction_requested = false;
            await originalCert.save();

            // Notify recipient
            const recipientEmail = decrypt(originalCert.recipient_email);
            const rejectHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Correction Request Update - Pramanit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 36px 40px 24px 40px; text-align: center; background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%); border-b: 1px solid #f1f5f9;">
                            <div style="font-size: 26px; font-weight: 900; color: #dc2626; letter-spacing: -0.5px; line-height: 1;">📝 Pramanit</div>
                            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 2px;">Name Correction Update</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Correction Request Declined</h1>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; font-weight: 500;">
                                Your name correction request for Certificate ID <strong style="color: #6d28d9; font-family: monospace;">${certificate_id}</strong> was reviewed by the issuer and could not be approved at this time.
                            </p>

                            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 24px;">
                                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase;">Status Notice</p>
                                <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: 500; line-height: 1.5;">
                                    Your existing certificate remains 100% valid under its original issued record.
                                </p>
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
            await sendEmail(
                recipientEmail,
                'Certificate Correction Request Update - Pramanit',
                rejectHtml
            );

            return res.json({ message: 'Correction request rejected', action: 'rejected' });
        }

        if (action === 'approve') {
            // IMPORTANT: Create a NEW certificate instead of modifying the old one
            // This maintains the integrity of the original issuance
            
            const crypto = require('crypto');
            const newCertId = crypto.randomBytes(8).toString('hex');
            
            // Create new verification record
            const newVerification = new Verification({
                cert_id: newCertId,
                recipient_name: corrected_data.name || originalCert.recipient_name,
                recipient_email: corrected_data.email || originalCert.recipient_email,
                recipient_email_hash: corrected_data.email ? 
                    require('../utils/encryption').hash(corrected_data.email) : 
                    originalCert.recipient_email_hash,
                issuer_id: originalCert.issuer_id,
                issuer_name: originalCert.issuer_name,
                issue_date: new Date(),
                data_hash: crypto.createHash('sha256').update(`${newCertId}-${corrected_data.name || originalCert.recipient_name}`).digest('hex'),
                status: 'active',
                org_name: originalCert.org_name,
                issuer_designation: originalCert.issuer_designation,
                org_logo_url: originalCert.org_logo_url,
                issuer_email: originalCert.issuer_email,
                recipient_token: crypto.randomBytes(16).toString('hex'),
                certificate_title: originalCert.certificate_title,
                design_id: originalCert.design_id
            });

            await newVerification.save();

            // Mark original as corrected (superseded)
            originalCert.correction_status = 'approved';
            originalCert.correction_requested = false;
            originalCert.status = 'revoked'; // Or 'superseded' if you prefer
            await originalCert.save();

            // Send new certificate email
            const recipientEmail = decrypt(newVerification.recipient_email);
            const issuerInfo = {
                name: originalCert.issuer_name,
                orgName: originalCert.org_name,
                email: originalCert.issuer_email,
                designation: originalCert.issuer_designation
            };

            await sendCertificateEmail(
                recipientEmail,
                newCertId,
                issuerInfo,
                [], // Attachments would be added here if re-generating certificate
                'Corrected Certificate - ' + originalCert.org_name,
                `<p>Your certificate has been corrected with the requested changes.</p>
                 <p><strong>New Certificate ID:</strong> ${newCertId}</p>
                 <p><strong>Old Certificate ID:</strong> ${certificate_id} (now inactive)</p>
                 <p>Please use the new certificate ID for all future verifications.</p>`
            );

            res.json({
                message: 'Correction approved and new certificate created',
                action: 'approved',
                new_certificate: {
                    cert_id: newCertId,
                    recipient_name: newVerification.recipient_name
                },
                old_certificate: {
                    cert_id: certificate_id,
                    status: 'revoked'
                }
            });
        }
    } catch (error) {
        console.error('Process correction error:', error);
        res.status(500).json({ message: 'Failed to process correction' });
    }
};

// Regenerate certificate with corrections
const regenerateCertificate = async (req, res) => {
    try {
        const { certificate_id, corrections } = req.body;
        const userId = req.user.id;

        // Find the certificate
        const verification = await Verification.findOne({ 
            cert_id: certificate_id,
            issuer_id: userId 
        });

        if (!verification) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        // This would integrate with your existing certificate generation logic
        // For now, return the data needed for regeneration
        res.json({
            message: 'Ready to regenerate certificate',
            original_data: {
                cert_id: certificate_id,
                recipient_name: verification.recipient_name,
                recipient_email: decrypt(verification.recipient_email),
                corrections: corrections
            }
        });
    } catch (error) {
        console.error('Regenerate certificate error:', error);
        res.status(500).json({ message: 'Failed to regenerate certificate' });
    }
};

// Get correction statistics for dashboard
const getCorrectionStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await Verification.aggregate([
            {
                $match: { 
                    issuer_id: new require('mongoose').Types.ObjectId(userId),
                    correction_requested: true
                }
            },
            {
                $group: {
                    _id: '$correction_status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0
        };

        stats.forEach(stat => {
            result[stat._id] = stat.count;
            result.total += stat.count;
        });

        res.json(result);
    } catch (error) {
        console.error('Get correction stats error:', error);
        res.status(500).json({ message: 'Failed to fetch correction statistics' });
    }
};

module.exports = {
    getCorrectionRequests,
    submitCorrectionRequest,
    processCorrection,
    regenerateCertificate,
    getCorrectionStats
};
