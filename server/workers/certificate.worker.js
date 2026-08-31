const fs = require('fs');
const path = require('path');

// Hardcoded absolute path for debugging certainty
const LOG_FILE = 'C:/Users/Joydip Maiti/Desktop/Pramanit/server/worker_debug.log';

const logFunc = (msg) => {
    try {
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        // If fs fails, we can't do much in a worker
    }
};

logFunc('Worker script started execution.');

try {
    const { parentPort, workerData } = require('worker_threads');
    const { createCanvas, loadImage, registerFont } = require('canvas');
    const QRCode = require('qrcode');
    const { drawCustomQRCode } = require('../utils/qrRenderer');
    const nodemailer = require('nodemailer');
    const { uploadToCDN } = require('../utils/cloudinaryService');
    const Verification = require('../models/Verification');
    const mongoose = require('mongoose');
    const crypto = require('crypto');
    const { PDFDocument } = require('pdf-lib');
    const dotenv = require('dotenv');

    dotenv.config();

    logFunc('Modules loaded successfully.');


    const { sendEmail } = require('../utils/emailService');

    // ...

    // Process Batch Logic
    const processBatch = async () => {
        const { recipients, designConfig, branding, mongoUri } = workerData;
        const { templatePath, fields, qrConfig, subject, emailBody } = designConfig;

        const results = { success: [], failed: [] };

        try {
            const templateImage = await loadImage(templatePath);
            const scaleFactor = templateImage.width / 800;

            for (let i = 0; i < recipients.length; i++) {
                let recipient = recipients[i];

                // normalize recipient keys to lowercase for consistent access
                const normalizedData = {};
                const recData = recipient.data || recipient;
                Object.keys(recData).forEach(key => {
                    normalizedData[key.trim().toLowerCase()] = recData[key];
                });
                // Merge normalized data back to recipient.data or recipient itself
                if (recipient.data) {
                    recipient.data = { ...recipient.data, ...normalizedData };
                } else {
                    recipient = { ...recipient, ...normalizedData };
                }

                try {
                    // ... (canvas logic remains somewhat separate per recipient for rendering)
                    const canvas = createCanvas(templateImage.width, templateImage.height);
                    const ctx = canvas.getContext('2d');

                    // 1. Draw Template
                    ctx.drawImage(templateImage, 0, 0, templateImage.width, templateImage.height);

                    // 2. Draw Dynamic Fields
                    fields.forEach(field => {
                        if (!field.isVisible) return;

                        const baseSize = parseFloat(field.fontSize) || 40;
                        const scaledFontSize = baseSize * scaleFactor;
                        let family = (field.fontFamily || 'Arial').replace(/"/g, '');

                        ctx.font = `${field.isBold ? 'bold ' : ''}${field.isItalic ? 'italic ' : ''}${scaledFontSize}px "${family}"`;
                        ctx.fillStyle = field.color || '#000000';
                        ctx.textAlign = 'center';

                        const x = parseFloat(field.x) * templateImage.width;
                        const y = (parseFloat(field.y) * templateImage.height) + (scaledFontSize * 0.4);

                        const value = recipient.data?.[field.id] || recipient.name || field.label;
                        ctx.fillText(value, x, y);

                        if (field.isUnderline) {
                            const metrics = ctx.measureText(value);
                            ctx.beginPath();
                            ctx.moveTo(x - metrics.width / 2, y + 5);
                            ctx.lineTo(x + metrics.width / 2, y + 5);
                            ctx.stroke();
                        }
                    });

                    // 3. Save Verification & Upload to CDN
                    const certId = crypto.randomUUID();
                    const recipientToken = crypto.randomBytes(32).toString('hex');

                    // Render Custom QR Code if enabled
                    const clientUrl = process.env.FRONTEND_URL ? (process.env.FRONTEND_URL.startsWith('http') ? process.env.FRONTEND_URL : `https://${process.env.FRONTEND_URL}`) : 'http://localhost:5173';
                    const verifyUrl = `${clientUrl.replace(/\/+$/, '')}/verify/${certId}`;

                    if (qrConfig && qrConfig.isVisible) {
                        const qrSize = (parseFloat(qrConfig.size) || 100) * scaleFactor;
                        const qrX = parseFloat(qrConfig.x) * templateImage.width;
                        const qrY = parseFloat(qrConfig.y) * templateImage.height;
                        const logoUrl = (qrConfig.showLogo ?? true) ? (qrConfig.logoUrl || branding?.org_logo_url) : null;

                        await drawCustomQRCode(ctx, qrX, qrY, qrSize, qrConfig, verifyUrl, logoUrl, certId);
                    }

                    const buffer = canvas.toBuffer('image/png');

                    // const cdnResult = await uploadToCDN(buffer, `certificates/${branding.org_name || 'general'}`);

                    const newVerification = new Verification({
                        cert_id: certId,
                        recipient_name: recipient.name || 'Recipient',
                        recipient_email: recipient.email || '',
                        issuer_id: branding._id,
                        issuer_name: branding.full_name || branding.org_name || 'CertiFlow',
                        org_name: branding.org_name,
                        issuer_designation: branding.designation,
                        org_logo_url: branding.org_logo_url, // Use global org logo for verification
                        issuer_email: branding.email,
                        issue_date: new Date(),
                        data_hash: crypto.createHash('sha256').update(`${certId}-${recipient.name}`).digest('hex'),
                        recipient_token: recipientToken,
                        certificate_title: designConfig.title || 'Professional Certificate',
                        design_id: designConfig.designId // Link to Design model
                    });

                    await newVerification.save();

                    // 4. Send Email (using Centralized EmailService)
                    const recipientEmail = recipient.email || recipient.data?.email;

                    if (recipientEmail) {
                        logFunc(`Sending email to ${recipientEmail}...`);
                        try {
                            let personalizedBody = emailBody || '';
                            const mergeData = {
                                ...recipient,
                                cert_id: certId,
                                certificate_link: verifyUrl,
                                recipient_name: recipient.name || 'Valued Recipient',
                                issuer_name: branding.full_name || branding.org_name || 'Pramanit Issuer'
                            };

                            Object.keys(mergeData).forEach(key => {
                                const regex = new RegExp(`{{${key}}}`, 'gi');
                                personalizedBody = personalizedBody.replace(regex, mergeData[key] || '');
                            });

                            // Always append an explicit "View & Verify Official Certificate Online" button if not present
                            if (!personalizedBody.includes('/verify/')) {
                                personalizedBody += `
                                <div style="margin-top: 24px; padding: 20px; background-color: #0f172a; border-radius: 14px; text-align: center; font-family: sans-serif; color: #ffffff;">
                                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #818cf8;">Official Digital Credential</p>
                                    <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #ffffff;">Your Digital Certificate is Verified</p>
                                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
                                        🎓 View & Verify Official Certificate Online
                                    </a>
                                    <p style="margin: 14px 0 0 0; font-size: 11px; color: #94a3b8; font-family: monospace;">Certificate ID: ${certId}</p>
                                </div>`;
                            }

                            // Generate Ultra HD PDF document
                            const pdfDoc = await PDFDocument.create();
                            const pdfImage = await pdfDoc.embedPng(buffer);
                            const pdfPage = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
                            pdfPage.drawImage(pdfImage, { x: 0, y: 0, width: pdfImage.width, height: pdfImage.height });
                            pdfDoc.setTitle('Verified Certificate');
                            pdfDoc.setAuthor(branding.full_name || branding.org_name || 'Pramanit');
                            pdfDoc.setSubject(`Credential for ${recipient.name || 'Recipient'}`);
                            const pdfBuffer = Buffer.from(await pdfDoc.save());

                            await sendEmail(
                                recipientEmail,
                                subject || 'Your Certificate',
                                personalizedBody,
                                [
                                    {
                                        filename: `certificate-${certId.slice(0, 8)}.pdf`,
                                        content: pdfBuffer,
                                        contentType: 'application/pdf'
                                    },
                                    {
                                        filename: `certificate-${certId.slice(0, 8)}.png`,
                                        content: buffer,
                                        contentType: 'image/png'
                                    }
                                ]
                            );
                            logFunc(`Email sent to ${recipientEmail}`);
                        } catch (emailErr) {
                            logFunc(`Email FAILED for ${recipientEmail}: ${emailErr.message}`);
                            throw emailErr;
                        }
                    } else {
                        logFunc(`Skipping email for ${recipient.name} (No email provided)`);
                    }

                    results.success.push(recipient.email);
                    parentPort.postMessage({ type: 'progress', current: i + 1, total: recipients.length });

                } catch (recipientError) {
                    logFunc(`Worker failed for ${recipient.email}: ${recipientError.message}`);
                    console.error(`Worker failed for ${recipient.email}:`, recipientError);
                    results.failed.push({ email: recipient.email, error: recipientError.message });
                }
            }

            parentPort.postMessage({ type: 'done', results });
        } catch (error) {
            parentPort.postMessage({ type: 'error', error: error.message });
        } finally {
            mongoose.connection.close();
        }
    };

    processBatch().catch(err => {
        logFunc(`FATAL ERROR in processBatch: ${err.message}`);
        if (parentPort) parentPort.postMessage({ type: 'error', error: err.message });
    });

} catch (globalErr) {
    logFunc(`CRITICAL WORKER CRASH: ${globalErr.message}\n${globalErr.stack}`);
    // Attempt to notify parent if possible
    try {
        const { parentPort } = require('worker_threads');
        if (parentPort) parentPort.postMessage({ type: 'error', error: globalErr.message });
    } catch (e) { }
}
