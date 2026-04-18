const fs = require('fs');
const path = require('path');
const { parentPort, workerData } = require('worker_threads');
const { createCanvas, loadImage, registerFont } = require('canvas');
const nodemailer = require('nodemailer');
const { uploadToCDN } = require('../utils/cloudinaryService');
const Verification = require('../models/Verification');
const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const { sendEmail } = require('../utils/emailService');
const { sendCertificateEmail } = require('../utils/enhancedEmailService');
const { createBatchReport } = require('../controllers/batchReport.controller');

// Rate limiting helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Optimized batch processing with parallelization
const processBatch = async () => {
    const { recipients, designConfig, branding, mongoUri } = workerData;
    const { templatePath, fields, qrConfig, subject, emailBody } = designConfig;

    const results = { success: [], failed: [] };

    try {
        await mongoose.connect(mongoUri);

        const templateImage = await loadImage(templatePath);
        const scaleFactor = templateImage.width / 800;

        // Pre-render template once
        const templateCanvas = createCanvas(templateImage.width, templateImage.height);
        const templateCtx = templateCanvas.getContext('2d');
        templateCtx.drawImage(templateImage, 0, 0, templateImage.width, templateImage.height);

        // Process recipients in batches of 10 (parallel)
        const BATCH_SIZE = 10;
        const RATE_LIMIT_DELAY = 1000; // 1 second between batches

        for (let batchStart = 0; batchStart < recipients.length; batchStart += BATCH_SIZE) {
            const batch = recipients.slice(batchStart, batchStart + BATCH_SIZE);

            // Process this batch in parallel
            const batchPromises = batch.map(async (recipient) => {
                try {
                    // Normalize recipient data once
                    const normalizedData = {};
                    const recData = recipient.data || recipient;
                    Object.keys(recData).forEach(key => {
                        normalizedData[key.trim().toLowerCase()] = recData[key];
                    });

                    if (recipient.data) {
                        recipient.data = { ...recipient.data, ...normalizedData };
                    } else {
                        recipient = { ...recipient, ...normalizedData };
                    }

                    // Create individual canvas for this recipient
                    const canvas = createCanvas(templateImage.width, templateImage.height);
                    const ctx = canvas.getContext('2d');

                    // Copy pre-rendered template
                    ctx.drawImage(templateCanvas, 0, 0);

                    // Render fields
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

                    // Generate certificate data
                    const certId = crypto.randomUUID();
                    const recipientToken = crypto.randomBytes(32).toString('hex');
                    const buffer = canvas.toBuffer('image/png');

                    // Create verification record
                    const newVerification = new Verification({
                        cert_id: certId,
                        recipient_name: recipient.name || 'Recipient',
                        recipient_email: recipient.email || '',
                        issuer_id: branding._id,
                        issuer_name: branding.full_name || branding.org_name || 'CertiFlow',
                        org_name: branding.org_name,
                        issuer_designation: branding.designation,
                        org_logo_url: branding.org_logo_url,
                        issuer_email: branding.email,
                        issue_date: new Date(),
                        data_hash: crypto.createHash('sha256').update(`${certId}-${recipient.name}`).digest('hex'),
                        recipient_token: recipientToken,
                        certificate_title: designConfig.title || 'Professional Certificate',
                        design_id: designConfig.designId
                    });

                    await newVerification.save();

                    // Prepare email with enhanced template
                    const recipientEmail = recipient.email || recipient.data?.email;
                    if (recipientEmail) {
                        // Use enhanced email template with issuer contact information
                        const issuerInfo = {
                            name: branding.full_name || 'Certificate Issuer',
                            orgName: branding.org_name || '',
                            email: branding.email || '',
                            designation: branding.designation || ''
                        };

                        await sendCertificateEmail(
                            recipientEmail,
                            certId,
                            issuerInfo,
                            [{
                                filename: `certificate-${certId.slice(0, 8)}.png`,
                                content: buffer
                            }],
                            subject, // Issuer's custom subject
                            emailBody // Issuer's custom email body
                        );
                    }

                    return { success: true, email: recipient.email };
                } catch (error) {
                    return { success: false, email: recipient.email, error: error.message };
                }
            });

            // Wait for current batch to complete
            const batchResults = await Promise.all(batchPromises);

            // Process batch results
            batchResults.forEach(result => {
                if (result.success) {
                    results.success.push(result.email);
                } else {
                    results.failed.push(result);
                }
            });

            // Report progress
            parentPort.postMessage({
                type: 'progress',
                current: Math.min(batchStart + BATCH_SIZE, recipients.length),
                total: recipients.length
            });

            // Rate limiting: wait between batches
            if (batchStart + BATCH_SIZE < recipients.length) {
                await sleep(RATE_LIMIT_DELAY);
            }
        }

        // Create detailed batch report
        try {
            await createBatchReport(
                branding._id,
                designConfig.designId,
                recipients.length,
                results.success,
                results.failed,
                'completed'
            );

            parentPort.postMessage({
                type: 'done',
                results,
                report: {
                    total: recipients.length,
                    successful: results.success.length,
                    failed: results.failed.length,
                    successRate: Math.round((results.success.length / recipients.length) * 100)
                }
            });
        } catch (reportError) {
            console.error('Failed to create batch report:', reportError);
            parentPort.postMessage({ type: 'error', error: reportError.message });
        }
    } catch (error) {
        parentPort.postMessage({ type: 'error', error: error.message });
    } finally {
        await mongoose.connection.close();
    }
};

// Start processing
processBatch().catch(err => {
    console.error(`FATAL ERROR in processBatch: ${err.message}`);
    if (parentPort) parentPort.postMessage({ type: 'error', error: err.message });
});
