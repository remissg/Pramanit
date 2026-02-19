const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createCanvas, loadImage, registerFont } = require('canvas');
const XLSX = require('xlsx');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const { sendEmail } = require('../utils/emailService');
const { Worker } = require('worker_threads');

const User = require('../models/User');
const Design = require('../models/Design');
const IssuanceHistory = require('../models/IssuanceHistory');
const Verification = require('../models/Verification');
const webhookService = require('../utils/webhookService');

const logIssuance = async (userId, designId, totalSent, recipientListRef) => {
    try {
        await IssuanceHistory.create({
            user: userId,
            design_id: designId || null,
            total_certificates: totalSent,
            recipient_emails: Array.isArray(recipientListRef) ? recipientListRef : [recipientListRef] // Store emails directly or ref string
        });
    } catch (e) {
        console.error('Failed to log issuance history:', e);
    }
};

const getSmtpConfig = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (user && user.smtp_host) {
            return {
                host: user.smtp_host,
                port: user.smtp_port,
                user: user.smtp_user,
                pass: user.smtp_pass
            };
        }
    } catch (e) {
        console.error('Failed to fetch user SMTP config:', e);
    }
    return null;
};

// Verification schema implementation
const saveVerification = async (record) => {
    try {
        await Verification.create({
            cert_id: record.certId,
            recipient_name: record.recipientName,
            recipient_email: record.recipientEmail,
            issuer_id: record.issuerId,
            issuer_name: record.issuerName,
            issue_date: record.issueDate,
            data_hash: record.dataHash,
            status: record.status,
            org_name: record.orgName,
            issuer_designation: record.issuerDesignation,
            org_logo_url: record.orgLogoUrl,
            issuer_email: record.issuerEmail,
            recipient_token: record.recipientToken,
            design_id: record.designId // Store design reference
        });
    } catch (e) {
        console.error('Failed to save verification:', e);
    }
};

const drawWatermark = (ctx, canvasWidth, canvasHeight) => {
    const fontSize = Math.max(12, canvasWidth * 0.015);
    ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
    ctx.fillStyle = 'rgba(100, 116, 139, 0.5)'; // Slate-500 with opacity
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Verified by Pramanit', canvasWidth / 2, canvasHeight - (canvasHeight * 0.03));
};

const generateHash = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const createPdfWithMetadata = async (imageBuffer, metadata) => {
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(imageBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    // Embed Metadata
    pdfDoc.setTitle('Verified Certificate');
    pdfDoc.setAuthor(metadata.issuerName);
    pdfDoc.setSubject(`Credential for ${metadata.recipientName}`);
    pdfDoc.setKeywords(['Pramanit', 'Verified', metadata.certId]);
    pdfDoc.setProducer('Pramanit Pro');
    pdfDoc.setCreator('Pramanit Engine');

    return await pdfDoc.save();
};

// Helper to parsing CSV or Excel
const parseRecipientsFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const results = [];

    const normalizeRow = (row) => {
        // Smart Email Mapping
        if (!row.email) {
            const emailKey = Object.keys(row).find(k => /email|e-mail|mail/i.test(k));
            if (emailKey) row.email = row[emailKey];
        }
        // Smart Name Mapping
        if (!row.name) {
            const nameKey = Object.keys(row).find(k => /name|recipient|person|student/i.test(k));
            if (nameKey) row.name = row[nameKey];
        }
        return row;
    };

    if (ext === '.csv') {
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
                .on('data', (row) => {
                    const normalized = normalizeRow(row);
                    if (normalized.name || normalized.email) {
                        results.push(normalized);
                    }
                })
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    } else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Normalize keys to lowercase for consistency
        return data.map(row => {
            const normalized = {};
            Object.keys(row).forEach(key => {
                normalized[key.trim().toLowerCase()] = row[key];
            });
            return normalizeRow(normalized);
        }).filter(r => r.name || r.email || Object.keys(r).length > 0);
    }
    return results;
};

// Temporary storage for uploaded files
let currentBatch = {
    templatePath: null,
    recipients: [],
};

const prepareBatch = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No template file uploaded' });
        }
        res.json({ templatePath: req.file.path });
    } catch (error) {
        console.error('Prepare batch error:', error);
        res.status(500).json({ message: 'Failed to prepare batch' });
    }
};

// Helper to determine the client URL
const getClientUrl = () => {
    return process.env.FRONTEND_URL
        ? `https://${process.env.FRONTEND_URL}`
        : 'http://localhost:5173';
};

const processSingle = async (req, res) => {
    try {
        const { templatePath, recipient, fields, subject, body, issuerName, qrConfig, designId } = req.body;

        if (!templatePath || !recipient) {
            return res.status(400).json({ message: 'Missing required data' });
        }

        // normalize recipient.data keys to lowercase for consistent access
        let recData = recipient.data || recipient;
        const normalizedData = {};
        Object.keys(recData).forEach(key => {
            normalizedData[key.trim().toLowerCase()] = recData[key];
        });
        // Merge normalized data back to ensure original keys are also available if needed, 
        // but prefer normalized access.
        // Actually, let's just use normalizedData for lookups.
        recData = { ...recData, ...normalizedData };


        // Check if template exists (Render ephemeral filesystem wipes uploads on restart/deploy)
        if (!fs.existsSync(templatePath)) {
            return res.status(400).json({
                message: 'Template file not found. The server likely restarted. Please upload the template again.',
                code: 'FILE_LOST'
            });
        }


        const image = await loadImage(templatePath);

        // Resize if too large to prevent huge attachments (max 2000px width)
        const MAX_WIDTH = 2000;
        let canvasWidth = image.width;
        let canvasHeight = image.height;

        if (canvasWidth > MAX_WIDTH) {
            const scale = MAX_WIDTH / canvasWidth;
            canvasWidth = MAX_WIDTH;
            canvasHeight = canvasHeight * scale;
        }

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Draw image scaled to new canvas dimensions
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

        const certId = crypto.randomUUID();
        const recipientToken = crypto.randomBytes(32).toString('hex');
        const clientUrl = getClientUrl();
        const verifyUrl = `${clientUrl}/verify/${certId}`;
        const portalUrl = `${clientUrl}/portal?token=${recipientToken}`;
        const dataHash = generateHash({
            name: recipient.name || recipient.email,
            email: recipient.email || '',
            event: recipient.data?.Course || recipient.data?.Event || '', // Specific fields for fingerprint
            issuerId: req.user.id,
            certId
        });

        const scaleFactor = canvasWidth / 800; // Reference width from frontend

        const fontMap = {
            'Inter': 'sans-serif',
            'Montserrat': 'sans-serif',
            'Outfit': 'sans-serif',
            'Playfair Display': 'serif',
            'serif': 'serif',
            'Times New Roman': 'serif',
            'Cursive': 'cursive',
            'Pacifico': 'cursive',
            'UnifrakturMaguntia': 'serif',
            'Monospace': 'monospace'
        };

        // Render each field
        if (fields && Array.isArray(fields)) {
            fields.forEach(field => {
                const baseSize = parseFloat(field.fontSize) || 40;
                const scaledFontSize = baseSize * scaleFactor;

                let family = field.fontFamily ? field.fontFamily.replace(/"/g, '') : 'Arial';
                if (fontMap[family]) family = fontMap[family];

                const style = (field.isBold ? 'bold ' : '') + (field.isItalic ? 'italic ' : '');
                ctx.font = `${style}${scaledFontSize}px "${family}"`;
                ctx.fillStyle = field.color || '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const x = parseFloat(field.x) * canvasWidth;
                const y = parseFloat(field.y) * canvasHeight;

                // const recData = recipient.data || recipient; // Removed to use outer normalized recData
                const fieldId = (field.id || '').trim().toLowerCase();

                let text = '';
                const exactMatch = recData[field.id];

                if (exactMatch !== undefined) {
                    text = exactMatch;
                } else {
                    const matchingKey = Object.keys(recData).find(k => k.trim().toLowerCase() === fieldId);
                    text = matchingKey ? recData[matchingKey] : (field.label || '');
                }

                text = text.toString();
                if (field.textCase === 'uppercase') text = text.toUpperCase();

                ctx.fillText(text, x, y);

                if (field.isUnderline) {
                    const metrics = ctx.measureText(text);
                    const underlineY = y + (scaledFontSize / 2) * 0.8;
                    const underlineWidth = metrics.width;

                    ctx.beginPath();
                    ctx.strokeStyle = field.color || '#000000';
                    ctx.lineWidth = Math.max(1, scaledFontSize / 20);
                    ctx.moveTo(x - underlineWidth / 2, underlineY);
                    ctx.lineTo(x + underlineWidth / 2, underlineY);
                    ctx.stroke();
                }
            });
        }

        // Render QR Code if enabled
        if (qrConfig && qrConfig.isVisible) {
            const qrSize = (parseFloat(qrConfig.size) || 100) * scaleFactor;
            const qrX = parseFloat(qrConfig.x) * canvasWidth;
            const qrY = parseFloat(qrConfig.y) * canvasHeight;

            const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });

            const qrImage = await loadImage(qrDataUrl);
            ctx.drawImage(qrImage, qrX - qrSize / 2, qrY - qrSize / 2, qrSize, qrSize);

            // Render Manual ID if enabled
            if (qrConfig.showManualId) {
                const fontSize = Math.max(10, qrSize * 0.12);
                ctx.font = `bold ${fontSize}px "Courier New", monospace`;
                ctx.fillStyle = '#6366f1'; // Indigo-500
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                // Add a small background for legibility
                const text = `ID: ${certId.toUpperCase()}`;
                const metrics = ctx.measureText(text);
                const padding = 4;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(
                    qrX - (metrics.width / 2) - padding,
                    qrY + (qrSize / 2) + 2,
                    metrics.width + (padding * 2),
                    fontSize + (padding * 2)
                );

                ctx.fillStyle = '#4f46e5'; // Indigo-600
                ctx.fillText(text, qrX, qrY + (qrSize / 2) + 4);
            }
        }

        // Fetch user branding details for verification
        const branding = await User.findById(req.user.id);

        // Render Watermark for Free Tier
        if (branding?.plan_type === 'free') {
            drawWatermark(ctx, canvas.width, canvas.height);
        }

        // Save Verification Record
        await saveVerification({
            certId,
            recipientName: recipient.name || 'Recipient',
            recipientEmail: recipient.email || '',
            issuerId: req.user.id, // Link to User model
            issuerName: branding?.full_name || issuerName || 'Pramanit User',
            orgName: branding?.org_name || '',
            issuerDesignation: branding?.designation || '',
            orgLogoUrl: branding?.org_logo_url || '',
            issuerEmail: branding?.email || '',
            issueDate: new Date().toISOString(),
            dataHash,
            status: 'active',
            recipientToken
        });

        const imageBuffer = canvas.toBuffer('image/png');
        const pdfContent = await createPdfWithMetadata(imageBuffer, {
            certId,
            recipientName: recipient.name || 'Recipient',
            issuerName: issuerName || 'CertiFlow User',
            verifyUrl
        });

        // Personalize body and subject using all keys in recipient data
        let personalizedBody = body || '';
        let personalizedSubject = subject || '';
        // const recData = recipient.data || recipient; // Removed to use outer normalized recData

        // Add verification info and issuer details to personalization
        const mergedData = {
            ...recData,
            cert_id: certId,
            verify_url: verifyUrl,
            certificate_link: verifyUrl,
            portal_link: portalUrl,
            issuer_name: branding?.full_name || issuerName || 'CertiFlow User',
            event_name: recData.Course || recData.course || recData.Event || recData.event || '',
            name: recData.Name || recData.name || recipient.name || 'Recipient'
        };

        // Replace merge tags (case-insensitive)
        Object.keys(mergedData).forEach(key => {
            const value = mergedData[key];
            // Match both {{key}} and {{Key}} patterns (case-insensitive)
            const regex = new RegExp(`{{${key}}}`, 'gi');
            personalizedBody = personalizedBody.replace(regex, value);
            personalizedSubject = personalizedSubject.replace(regex, value);
        });

        // ---------------------------------------------------------
        // TYPO GUARD: Auto-correct "Congradulation" if present
        // ---------------------------------------------------------
        personalizedSubject = personalizedSubject.replace(/Congradulation/gi, 'Congratulations');
        personalizedBody = personalizedBody.replace(/Congradulation/gi, 'Congratulations');


        // Check for email using the normalized 'email' key
        // We already normalized keys to lowercase in recData, so 'Email' became 'email'
        if (recData.email) {
            try {
                const smtpConfig = await getSmtpConfig(req.user.id);
                console.log(`[Controller] Attempting to send email to ${recData.email}...`);
                await sendEmail(
                    recData.email,
                    personalizedSubject || 'Your Certificate',
                    personalizedBody,
                    [
                        {
                            filename: `certificate-${(mergedData.name || 'document').replace(/\\s+/g, '_')}.pdf`,
                            content: Buffer.from(pdfContent),
                        },
                    ],
                    smtpConfig
                );
            } catch (emailError) {
                console.error('Email sending failed (Non-blocking):', emailError);
                // We proceed without throwing, enabling the certificate to be returned
                // potentially adding a flag to the response
                return res.json({
                    success: true,
                    email: recData.email,
                    emailSent: false,
                    message: 'Certificate generated successfully. WARNING: Email sending failed (Server Timeout). Please download the certificate manually.'
                });
            }
        }

        res.json({
            success: true,
            email: recData.email,
            emailSent: true,
            message: 'Certificate generated and email sent successfully.'
        });

        // Log issuance
        await logIssuance(req.user.id, designId, 1, [recData.email]);

    } catch (error) {
        console.error('Process single error:', error);
        res.status(500).json({ message: 'Failed to process certificate', error: error.message });
    }
};

const processCertificates = async (req, res) => {
    try {
        const { subject, body, nameX, nameY, fontSize, fontColor, fontFamily, fields, qrConfig } = req.body;

        if (!req.files || !req.files.template || !req.files.data) {
            return res.status(400).json({ message: 'Missing template or data file' });
        }

        const templatePath = req.files.template[0].path;
        const dataPath = req.files.data[0].path;

        let recipients = await parseRecipientsFile(dataPath);
        const branding = await User.findById(req.user.id);
        const smtpConfig = await getSmtpConfig(req.user.id);

        // Spawn Worker Thread
        const workerPath = path.join(__dirname, '../workers/certificate.worker.js');
        console.log(`[Controller] Spawning worker at: ${workerPath}`);
        console.log(`[Controller] Worker Data Recipients: ${recipients.length}`);

        const worker = new Worker(workerPath, {
            workerData: {
                recipients,
                designConfig: {
                    templatePath,
                    fields: fields ? JSON.parse(fields) : [],
                    qrConfig: qrConfig ? JSON.parse(qrConfig) : null,
                    subject,
                    emailBody: body
                },
                branding: branding.toObject(),
                smtpConfig,
                mongoUri: process.env.MONGODB_URI
            }
        });

        console.log('[Controller] Worker spawned successfully.');

        worker.on('message', (message) => {
            if (message.type === 'progress') {
                console.log(`Progress: ${message.current}/${message.total}`);
                // In a real app, we'd emit this via Socket.io
            } else if (message.type === 'done') {
                console.log('Worker finished processing batch.');

                // Cleanup files after worker is done
                try {
                    if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
                    if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
                } catch (e) {
                    console.error('Cleanup error:', e);
                }

                // Log issuance once
                if (message.results.success.length > 0) {
                    logIssuance(
                        req.user.id,
                        req.body.designId,
                        message.results.success.length,
                        message.results.success
                    );
                }
            }
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
        });

        worker.on('exit', (code) => {
            if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
        });

        // Respond immediately - the worker handles the rest
        res.json({ message: 'Issuance started in background. You will be notified shortly.' });

    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({ message: 'Failed to start issuance', error: error.message });
    }
};

const previewBatch = async (req, res) => {
    try {
        if (!req.files || !req.files.template) {
            return res.status(400).json({ message: 'No template file uploaded' });
        }

        const templatePath = req.files.template[0].path;
        let fields = [];
        try {
            fields = req.body.fields ? JSON.parse(req.body.fields) : [];
        } catch (e) {
            console.error("Fields parse error", e);
        }

        let recipients = [];
        if (req.files.data) {
            const dataPath = req.files.data[0].path;
            recipients = await parseRecipientsFile(dataPath);
        } else if (req.body.recipients) {
            try {
                recipients = JSON.parse(req.body.recipients);
            } catch (e) {
                console.error("Recipients JSON parse error", e);
            }
        }

        // Take first 5 or generate dynamic mock data
        let previewRecipients = recipients.slice(0, 5);
        if (previewRecipients.length === 0 && !req.body.recipients) {
            // Generate mock data based on actual fields defined by user
            previewRecipients = [1, 2, 3].map(i => {
                const mock = { name: `Sample Name ${i}` };
                fields.forEach(f => {
                    if (f.id === 'name') return;
                    mock[f.id] = `Sample ${f.label} ${i}`;
                });
                return mock;
            });
        }

        const previews = [];
        const image = await loadImage(templatePath);

        const fontMap = {
            'Inter': 'sans-serif',
            'Montserrat': 'sans-serif',
            'Outfit': 'sans-serif',
            'Playfair Display': 'serif',
            'serif': 'serif',
            'Times New Roman': 'serif',
            'Cursive': 'cursive',
            'Pacifico': 'cursive',
            'UnifrakturMaguntia': 'serif',
            'Monospace': 'monospace'
        };

        const MAX_WIDTH = 800;
        const resizeScale = Math.min(1, MAX_WIDTH / image.width);
        const canvasWidth = image.width * resizeScale;
        const canvasHeight = image.height * resizeScale;

        for (const recipient of previewRecipients) {
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvasWidth, canvasHeight);

            const scaleFactor = canvasWidth / 800;

            if (fields && Array.isArray(fields)) {
                fields.forEach(field => {
                    const baseSize = parseFloat(field.fontSize) || 40;
                    const scaledFontSize = baseSize * scaleFactor;

                    let family = field.fontFamily ? field.fontFamily.replace(/"/g, '') : 'Arial';
                    if (fontMap[family]) family = fontMap[family];

                    const style = (field.isBold ? 'bold ' : '') + (field.isItalic ? 'italic ' : '');
                    ctx.font = `${style}${scaledFontSize}px "${family}"`;
                    ctx.fillStyle = field.color || '#000000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const x = parseFloat(field.x) * canvasWidth;
                    const y = parseFloat(field.y) * canvasHeight;

                    const recData = recipient.data || recipient;
                    const fieldId = (field.id || '').trim().toLowerCase();

                    let text = '';
                    const exactMatch = recData[field.id];

                    if (exactMatch !== undefined) {
                        text = exactMatch;
                    } else {
                        const matchingKey = Object.keys(recData).find(k => k.trim().toLowerCase() === fieldId);
                        text = matchingKey ? recData[matchingKey] : (field.label || '');
                    }

                    text = text.toString();
                    if (field.textCase === 'uppercase') text = text.toUpperCase();

                    ctx.fillText(text, x, y);

                    if (field.isUnderline) {
                        const metrics = ctx.measureText(text);
                        const underlineY = y + (scaledFontSize / 2) * 0.8;
                        const underlineWidth = metrics.width;

                        ctx.beginPath();
                        ctx.strokeStyle = field.color || '#000000';
                        ctx.lineWidth = Math.max(1, scaledFontSize / 20);
                        ctx.moveTo(x - underlineWidth / 2, underlineY);
                        ctx.lineTo(x + underlineWidth / 2, underlineY);
                        ctx.stroke();
                    }
                });
            }

            const qrConfig = req.body.qrConfig ? JSON.parse(req.body.qrConfig) : null;
            if (qrConfig && qrConfig.isVisible) {
                const qrSize = (parseFloat(qrConfig.size) || 100) * scaleFactor;
                const qrX = parseFloat(qrConfig.x) * canvasWidth;
                const qrY = parseFloat(qrConfig.y) * canvasHeight;

                const clientUrl = getClientUrl();
                const qrDataUrl = await QRCode.toDataURL(`${clientUrl}/verify/sample-uuid`, {
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });

                const qrImage = await loadImage(qrDataUrl);
                ctx.drawImage(qrImage, qrX - qrSize / 2, qrY - qrSize / 2, qrSize, qrSize);
            }

            const buffer = canvas.toBuffer('image/png');
            previews.push({
                name: recipient.name || 'Sample',
                image: `data:image/png;base64,${buffer.toString('base64')}`
            });
        }

        // Cleanup
        try {
            if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
            if (req.files.data && fs.existsSync(req.files.data[0].path)) fs.unlinkSync(req.files.data[0].path);
        } catch (e) { console.error("Cleanup error", e); }

        res.status(200).json({ previews });

    } catch (error) {
        console.error('Preview Error:', error);
        res.status(500).json({ message: 'Error generating previews' });
    }
}

const getRecipientPortal = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: 'Missing access token.' });

        const record = await Verification.findOne({ recipient_token: token });
        if (!record) return res.status(404).json({ message: 'Invalid or expired access token.' });

        res.json({
            certId: record.cert_id,
            recipientName: record.recipient_name,
            recipientEmail: record.recipient_email,
            issuerName: record.issuer_name,
            orgName: record.org_name,
            issuerDesignation: record.issuer_designation,
            orgLogoUrl: record.org_logo_url,
            issuerEmail: record.issuer_email,
            issueDate: record.issue_date,
            status: record.status,
            correctionRequested: record.correction_requested,
            correctionStatus: record.correction_status,
            requestedName: record.requested_name,
            certificateTitle: record.certificate_title || 'Professional Certificate'
        });
    } catch (e) {
        console.error('Portal access error:', e);
        res.status(500).json({ message: 'Failed to access recipient portal.' });
    }
};

const requestCorrection = async (req, res) => {
    try {
        const { token, newName } = req.body;
        if (!token || !newName) return res.status(400).json({ message: 'Missing token or new name.' });

        const record = await Verification.findOne({ recipient_token: token });
        if (!record) return res.status(404).json({ message: 'Access denied.' });

        record.correction_requested = true;
        record.requested_name = newName;
        record.correction_status = 'pending';
        await record.save();

        res.json({ message: 'Correction request submitted successfully.' });
    } catch (e) {
        console.error('Correction request error:', e);
        res.status(500).json({ message: 'Failed to submit correction request.' });
    }
};

const verifyCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch record using Mongoose
        const record = await Verification.findOne({ cert_id: id });

        if (!record) {
            return res.status(404).json({ message: 'Certificate not found or invalid id.' });
        }

        // Increment scan count atomically
        const updatedRecord = await Verification.findOneAndUpdate(
            { cert_id: id },
            { $inc: { scan_count: 1 } },
            { new: true }
        );

        // Fetch Issuer Settings
        const issuer = await User.findById(updatedRecord.issuer_id).select('social_settings webhook_url');

        // Map Mongoose DB fields to camelCase for frontend
        res.json({
            certId: updatedRecord.cert_id,
            recipientName: updatedRecord.recipient_name,
            recipientEmail: updatedRecord.recipient_email,
            issuerName: updatedRecord.issuer_name,
            orgName: updatedRecord.org_name,
            issuerDesignation: updatedRecord.issuer_designation,
            orgLogoUrl: updatedRecord.org_logo_url,
            issuerEmail: updatedRecord.issuer_email,
            issueDate: updatedRecord.issue_date,
            scanCount: updatedRecord.scan_count,
            status: updatedRecord.status,
            certificateTitle: updatedRecord.certificate_title || 'Professional Certificate',
            socialSettings: issuer?.social_settings || { allow_sharing: true, default_hashtags: '' }
        });

        // Trigger Webhook if configured
        if (issuer && issuer.webhook_url) {
            webhookService.sendWebhook(issuer.webhook_url, 'certificate.verified', {
                cert_id: updatedRecord.cert_id,
                recipient_name: updatedRecord.recipient_name,
                scan_count: updatedRecord.scan_count,
                verified_at: new Date().toISOString()
            });
        }

    } catch (e) {
        console.error('Verify error:', e);
        res.status(500).json({ message: 'Failed to verify certificate.' });
    }
};

const getCorrectionRequests = async (req, res) => {
    try {
        const requests = await Verification.find({
            issuer_id: req.user.id,
            correction_requested: true,
            correction_status: 'pending'
        }).sort({ created_at: -1 });

        res.json(requests.map(r => ({
            id: r._id,
            certId: r.cert_id,
            recipientName: r.recipient_name,
            requestedName: r.requested_name,
            issueDate: r.issue_date,
            status: r.correction_status
        })));
    } catch (e) {
        console.error('Get correction requests error:', e);
        res.status(500).json({ message: 'Failed to fetch correction requests.' });
    }
};

const handleCorrectionAction = async (req, res) => {
    try {
        const { id, action } = req.body; // action: 'approve' | 'reject'
        if (!id || !action) return res.status(400).json({ message: 'Missing ID or action.' });

        const record = await Verification.findById(id);
        if (!record || record.issuer_id.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        if (action === 'approve') {
            record.recipient_name = record.requested_name;
            record.correction_status = 'approved';
        } else {
            record.correction_status = 'rejected';
        }

        record.correction_requested = false;
        await record.save();

        res.json({ message: `Correction ${action}d successfully.` });
    } catch (e) {
        console.error('Handle correction action error:', e);
        res.status(500).json({ message: 'Failed to process correction action.' });
    }
};

const getIssuanceHistory = async (req, res) => {
    try {
        const history = await IssuanceHistory.find({ user: req.user.id })
            .populate('design_id', 'name')
            .sort({ timestamp: -1 });

        // Transform for frontend
        const formatted = history.map(h => ({
            id: h._id,
            design_name: h.design_id ? h.design_id.name : (h.design_name || 'Deleted Design'),
            total_certificates: h.total_certificates,
            total_sent: h.total_certificates, // Alias for frontend compatibility
            timestamp: h.timestamp
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get issuance history error:', err);
        res.status(500).json({ message: 'Failed to fetch issuance history' });
    }
};

const sendTestEmail = async (req, res) => {
    try {
        const { email, subject, body, issuerName } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email address required' });
        }

        // Fetch user branding details
        const branding = await User.findById(req.user.id);

        // Create sample data for testing
        const sampleData = {
            name: branding?.full_name || 'Test User',
            course: 'Sample Course Name',
            event_name: 'Sample Course Name',
            issuer_name: issuerName || branding?.full_name || 'Your Name',
            cert_id: 'TEST-CERT-ID-12345',
            verify_url: 'https://example.com/verify/test',
            certificate_link: 'https://example.com/verify/test',
            portal_link: 'https://example.com/portal?token=test-token'
        };

        // Replace merge tags (case-insensitive)
        let personalizedBody = body || '';
        let personalizedSubject = subject || '';

        Object.keys(sampleData).forEach(key => {
            const value = sampleData[key];
            const regex = new RegExp(`{{${key}}}`, 'gi');
            personalizedBody = personalizedBody.replace(regex, value);
            personalizedSubject = personalizedSubject.replace(regex, value);
        });

        const smtpConfig = await getSmtpConfig(req.user.id);
        await sendEmail(
            email,
            personalizedSubject || 'Test Email',
            personalizedBody,
            [],
            smtpConfig
        );

        res.json({ message: 'Test email sent successfully' });
    } catch (error) {
        console.error('Send test email error:', error);
        res.status(500).json({ message: 'Failed to send test email', error: error.message });
    }
};

const getCertificateOGImage = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Verification.findOne({ cert_id: id }).populate('design_id');

        if (!record) {
            return res.status(404).send('Certificate not found');
        }

        let image, canvas, ctx;
        const fontMap = {
            'Inter': 'sans-serif',
            'Montserrat': 'sans-serif',
            'Outfit': 'sans-serif',
            'Playfair Display': 'serif',
            'serif': 'serif',
            'Times New Roman': 'serif',
            'Cursive': 'cursive',
            'Pacifico': 'cursive',
            'UnifrakturMaguntia': 'serif',
            'Monospace': 'monospace'
        };

        // Helper to render fields
        const renderFields = async (ctx, fields, width, height, data) => {
            const scaleFactor = width / 800;
            fields.forEach(field => {
                const baseSize = parseFloat(field.fontSize) || 40;
                const scaledFontSize = baseSize * scaleFactor;

                let family = field.fontFamily ? field.fontFamily.replace(/"/g, '') : 'Arial';
                if (fontMap[family]) family = fontMap[family];

                const style = (field.isBold ? 'bold ' : '') + (field.isItalic ? 'italic ' : '');
                ctx.font = `${style}${scaledFontSize}px "${family}"`;
                ctx.fillStyle = field.color || '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const x = parseFloat(field.x) * width;
                const y = parseFloat(field.y) * height;

                // Simple Placeholders replacement
                let text = field.text || field.label || '';
                // Check if text contains merge tags
                if (text.includes('{{') || text.includes('{')) {
                    Object.keys(data).forEach(key => {
                        const regex = new RegExp(`{{${key}}}|{${key}}`, 'gi');
                        text = text.replace(regex, data[key] || '');
                    });
                    // Cleanup unused tags
                    text = text.replace(/{{.*?}}|{.*?}/g, '');
                } else if (field.id) {
                    // Direct ID match fallback
                    const key = field.id.trim().toLowerCase();
                    const match = Object.keys(data).find(k => k.toLowerCase() === key);
                    if (match) text = data[match];
                }

                if (field.textCase === 'uppercase') text = text.toUpperCase();
                ctx.fillText(text, x, y);

                if (field.isUnderline) {
                    const metrics = ctx.measureText(text);
                    const underlineY = y + (scaledFontSize / 2) * 0.8;
                    const h = Math.max(1, scaledFontSize / 20);
                    ctx.fillRect(x - metrics.width / 2, underlineY, metrics.width, h);
                }
            });
        };

        if (record.design_id && record.design_id.design_json) {
            // Render from Design JSON
            const design = record.design_id.design_json;
            let bgUrl = '';

            if (design.backgroundImage && design.backgroundImage.src) {
                bgUrl = design.backgroundImage.src;
            } else if (typeof design.backgroundImage === 'string') {
                bgUrl = design.backgroundImage;
            }

            if (bgUrl && (bgUrl.startsWith('http') || bgUrl.startsWith('data:'))) {
                image = await loadImage(bgUrl);
            } else {
                // Fallback blank canvas
                canvas = createCanvas(800, 600);
                ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 800, 600);
            }

            if (image) {
                canvas = createCanvas(image.width, image.height);
                ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
            }

            // Convert Fabric Objects to Fields
            const fields = [];
            if (design.objects) {
                design.objects.forEach(obj => {
                    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
                        fields.push({
                            id: obj.id || obj.text, // approximate ID
                            text: obj.text,
                            x: (obj.left + (obj.originX === 'center' ? 0 : obj.width / 2)) / canvas.width,
                            y: (obj.top + (obj.originY === 'center' ? 0 : obj.height / 2)) / canvas.height,
                            fontSize: obj.fontSize,
                            fontFamily: obj.fontFamily,
                            color: obj.fill,
                            isBold: obj.fontWeight === 'bold',
                            isItalic: obj.fontStyle === 'italic',
                            isUnderline: obj.underline,
                            textCase: 'normal'
                        });
                    }
                });
            }

            // Prepare Data
            const data = {
                name: record.recipient_name,
                email: record.getDecryptedEmail ? record.getDecryptedEmail() : record.recipient_email,
                issuer: record.issuer_name,
                date: record.issue_date.toISOString().split('T')[0],
                cert_id: record.cert_id,
            };
            if (record.certificate_title) data.course = record.certificate_title;

            await renderFields(ctx, fields, canvas.width, canvas.height, data);

        } else {
            // FALLBACK: User deleted design or legacy record.
            // Render a generic clean certificate.
            canvas = createCanvas(800, 600);
            ctx = canvas.getContext('2d');

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 800, 600);
            gradient.addColorStop(0, '#f8fafc');
            gradient.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 600);

            // Border
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 20;
            ctx.strokeRect(40, 40, 720, 520);

            // Text
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';

            ctx.font = 'bold 40px "Inter", sans-serif';
            ctx.fillText('CERTIFICATE OF COMPLETION', 400, 150);

            ctx.font = '30px "Inter", sans-serif';
            ctx.fillText('Presented to', 400, 240);

            ctx.font = 'bold 50px "Inter", sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.fillText(record.recipient_name, 400, 320);

            ctx.fillStyle = '#475569';
            ctx.font = '20px "Inter", sans-serif';
            ctx.fillText(`Issued by ${record.issuer_name}`, 400, 420);
            ctx.fillText(`Date: ${record.issue_date.toISOString().split('T')[0]}`, 400, 450);
        }

        res.setHeader('Content-Type', 'image/png');
        // Cache for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400');
        canvas.createPNGStream().pipe(res);

    } catch (e) {
        console.error('OG Image generation error:', e);
        res.status(500).send('Failed to generate image');
    }
};

module.exports = {
    prepareBatch,
    processSingle,
    processCertificates,
    sendEmail, // This is the simple alias now? No, sendEmail is imported from utils. 
    // Wait, previous exports had 'sendEmail: sendTestEmail' alias but 'sendEmail' key? 
    // Step 9988 showed: sendEmail, ... sendTestEmail ...
    // Actually, line 999 shows `sendEmail,` (from import), and line 1007 `sendTestEmail`.
    // And line 1058 `sendEmail: sendTestEmail`
    // I will keep it consistent with what it SHOULD be.
    // sendEmail (utility) shouldn't satisfy the route handler if it's the util.
    // The route 'test-email' likely uses `sendTestEmail` controller.
    // ROUTE: router.post('/test-email', ..., certificateController.sendEmail);
    // So the EXPORT named 'sendEmail' MUST be the `sendTestEmail` function?
    // Let's check imports. `const { sendEmail } = require('../utils/emailService');` at line 9.
    // So I should export `sendTestEmail` AS `sendEmail` or rename route usage.
    // Existing export was: `sendEmail: sendTestEmail`.

    prepareBatch,
    processSingle,
    processCertificates,
    previewBatch,
    getIssuanceHistory,
    verifyCertificate,
    getRecipientPortal,
    requestCorrection,
    getCorrectionRequests,
    handleCorrectionAction,
    sendEmail: sendTestEmail, // Aliasing for route compatibility
    getCertificateOGImage
};


