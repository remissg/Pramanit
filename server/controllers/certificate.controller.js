const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createCanvas, loadImage, registerFont } = require('canvas');
const XLSX = require('xlsx');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const { sendEmail } = require('../utils/emailService');
const User = require('../models/User');
const Design = require('../models/Design');
const IssuanceHistory = require('../models/IssuanceHistory');
const Verification = require('../models/Verification');

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
            issuer_email: record.issuerEmail
        });
    } catch (e) {
        console.error('Failed to save verification:', e);
    }
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
    pdfDoc.setKeywords(['CertiFlow', 'Verified', metadata.certId]);
    pdfDoc.setProducer('CertiFlow Pro');
    pdfDoc.setCreator('CertiFlow Engine');

    return await pdfDoc.save();
};

// Helper to parse CSV or Excel
const parseRecipientsFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const results = [];

    if (ext === '.csv') {
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
                .on('data', (row) => {
                    if (row.name || row.recipient || row.email) {
                        if (!row.name && row.recipient) row.name = row.recipient;
                        results.push(row);
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
                normalized[key.trim()] = row[key];
            });
            // Ensure name is present for legacy logic support
            const nameKey = Object.keys(normalized).find(k => /name|recipient|person/i.test(k));
            if (!normalized.name && nameKey) {
                normalized.name = normalized[nameKey];
            }
            return normalized;
        }).filter(r => r.name || Object.keys(r).length > 0);
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

const processSingle = async (req, res) => {
    try {
        const { templatePath, recipient, fields, subject, body, issuerName, qrConfig, designId } = req.body;

        if (!templatePath || !recipient) {
            return res.status(400).json({ message: 'Missing required data' });
        }

        const image = await loadImage(templatePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0, image.width, image.height);

        const certId = crypto.randomUUID();
        const verifyUrl = `http://localhost:5173/verify/${certId}`;
        const dataHash = generateHash({
            name: recipient.name || recipient.email,
            email: recipient.email || '',
            event: recipient.data?.Course || recipient.data?.Event || '', // Specific fields for fingerprint
            issuerId: req.user.id,
            certId
        });

        const scaleFactor = image.width / 800; // Reference width from frontend

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

                const x = parseFloat(field.x) * image.width;
                const y = parseFloat(field.y) * image.height;

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

        // Render QR Code if enabled
        if (qrConfig && qrConfig.isVisible) {
            const qrSize = (parseFloat(qrConfig.size) || 100) * scaleFactor;
            const qrX = parseFloat(qrConfig.x) * image.width;
            const qrY = parseFloat(qrConfig.y) * image.height;

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
                const text = `ID: ${certId.substring(0, 18).toUpperCase()}...`;
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

        // Save Verification Record
        await saveVerification({
            certId,
            recipientName: recipient.name || 'Recipient',
            recipientEmail: recipient.email || '',
            issuerId: req.user.id, // Link to User model
            issuerName: branding?.full_name || issuerName || 'CertiFlow User',
            orgName: branding?.org_name || '',
            issuerDesignation: branding?.designation || '',
            orgLogoUrl: branding?.org_logo_url || '',
            issuerEmail: branding?.email || '',
            issueDate: new Date().toISOString(),
            dataHash,
            status: 'active'
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
        const recData = recipient.data || recipient;

        // Add verification info and issuer details to personalization
        const mergedData = {
            ...recData,
            cert_id: certId,
            verify_url: verifyUrl,
            certificate_link: verifyUrl,
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


        if (recData.email || recData.Email) {
            const smtpConfig = await getSmtpConfig(req.user.id);
            await sendEmail(
                recData.email || recData.Email,
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
        }

        res.json({ success: true, email: recData.email });

        // Log issuance
        await logIssuance(req.user.id, designId, 1, [recData.email]);

    } catch (error) {
        console.error('Process single error:', error);
        res.status(500).json({ message: 'Failed to process certificate', error: error.message });
    }
};

const processCertificates = async (req, res) => {
    try {
        const { subject, body, nameX, nameY, fontSize, fontColor, fontFamily } = req.body;

        // Check if files were uploaded
        if (!req.files || !req.files.template || !req.files.data) {
            return res.status(400).json({ message: 'Missing template or data file' });
        }

        const templatePath = req.files.template[0].path;
        const dataPath = req.files.data[0].path;

        // Parse CSV or Excel
        let recipients = await parseRecipientsFile(dataPath);

        console.log(`Parsed ${recipients.length} recipients.`);

        // Process certificates
        const processResults = {
            success: [],
            failed: [],
        };

        // Load the template image once
        const image = await loadImage(templatePath);

        for (const recipient of recipients) {
            try {
                const canvas = createCanvas(image.width, image.height);
                const ctx = canvas.getContext('2d');

                // Draw template
                ctx.drawImage(image, 0, 0, image.width, image.height);

                // Calculate scale factor relative to frontend designer (reference width = 800px)
                const scaleFactor = image.width / 800;
                const baseSize = parseFloat(fontSize) || 40;
                const scaledFontSize = baseSize * scaleFactor;

                // Better font handling for node-canvas
                let family = fontFamily ? fontFamily.replace(/"/g, '') : 'Arial';

                // Map common font selections to base families for reliable backend rendering
                const fontMap = {
                    'Inter': 'sans-serif',
                    'serif': 'serif',
                    'Times New Roman': 'serif',
                    'Cursive': 'cursive',
                    'Pacifico': 'cursive',
                    'Monospace': 'monospace'
                };

                if (fontMap[family]) family = fontMap[family];

                ctx.font = `${scaledFontSize}px "${family}"`;
                ctx.fillStyle = fontColor || '#000000';
                ctx.textAlign = 'center';

                // Calculate real coordinates from percentages
                // nameX is now treated as the center point
                const x = parseFloat(nameX) * image.width;
                const y = (parseFloat(nameY) * image.height) + (scaledFontSize * 0.8);

                ctx.fillText(recipient.name, x, y);

                // Create buffer
                const buffer = canvas.toBuffer('image/png');

                // Send email
                let personalizedBody = body;
                Object.keys(recipient).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'gi');
                    personalizedBody = personalizedBody.replace(regex, recipient[key]);
                });
                personalizedBody = personalizedBody.replace(/{name}/gi, recipient.name);

                if (recipient.email) {
                    const smtpConfig = await getSmtpConfig(req.user.id);
                    await sendEmail(
                        recipient.email,
                        subject || 'Your Certificate',
                        personalizedBody,
                        [
                            {
                                filename: `certificate-${recipient.name.replace(/\s+/g, '_')}.png`,
                                content: buffer,
                            },
                        ],
                        smtpConfig
                    );
                    processResults.success.push(recipient.email);
                }
            } catch (err) {
                console.error(`Failed for ${recipient.email}:`, err);
                processResults.failed.push({ email: recipient.email, error: err.message });
            }
        }

        // Cleanup uploaded files
        try {
            if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
            if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
        } catch (e) {
            console.error('Error cleaning up files:', e);
        }

        res.json({ message: 'Batch processing executed', results: processResults });

        // Log issuance
        if (processResults.success.length > 0) {
            await logIssuance(
                req.user.id,
                req.body.designId,
                processResults.success.length,
                processResults.success
            );
        }

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
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

        for (const recipient of previewRecipients) {
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0, image.width, image.height);

            const scaleFactor = image.width / 800;

            if (fields && Array.isArray(fields)) {
                fields.forEach(field => {
                    // Try getting data from normalized keys or original row
                    const content = recipient[field.id] || recipient.name || 'N/A';

                    const baseSize = parseFloat(field.fontSize) || 40;
                    const scaledFontSize = baseSize * scaleFactor;

                    let family = field.fontFamily ? field.fontFamily.replace(/"/g, '') : 'Arial';
                    if (fontMap[family]) family = fontMap[family];

                    const style = (field.isBold ? 'bold ' : '') + (field.isItalic ? 'italic ' : '');
                    ctx.font = `${style}${scaledFontSize}px "${family}"`;
                    ctx.fillStyle = field.color || '#000000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const x = parseFloat(field.x) * image.width;
                    const y = parseFloat(field.y) * image.height;

                    // Robust Data Lookup (Trimmed & Case-Insensitive)
                    const recData = recipient.data || recipient;
                    const fieldId = (field.id || '').trim().toLowerCase();

                    let text = '';
                    const exactMatch = recData[field.id];

                    if (exactMatch !== undefined) {
                        text = exactMatch;
                    } else {
                        // Fallback to case-insensitive search
                        const matchingKey = Object.keys(recData).find(k => k.trim().toLowerCase() === fieldId);
                        text = matchingKey ? recData[matchingKey] : (field.label || '');
                    }

                    text = text.toString();
                    if (field.textCase === 'uppercase') text = text.toUpperCase();

                    ctx.fillText(text, x, y);

                    // Handle Underline (Manual Drawing)
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

            // Render QR Code Preview if enabled
            const qrConfig = req.body.qrConfig ? JSON.parse(req.body.qrConfig) : null;
            if (qrConfig && qrConfig.isVisible) {
                const qrSize = (parseFloat(qrConfig.size) || 100) * scaleFactor;
                const qrX = parseFloat(qrConfig.x) * image.width;
                const qrY = parseFloat(qrConfig.y) * image.height;

                const qrDataUrl = await QRCode.toDataURL('http://localhost:5173/verify/sample-uuid', {
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
            status: updatedRecord.status
        });

    } catch (e) {
        console.error('Verify error:', e);
        res.status(500).json({ message: 'Failed to verify certificate.' });
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
            certificate_link: 'https://example.com/verify/test'
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

module.exports = {
    processCertificates,
    sendEmail: sendTestEmail,
    previewBatch,
    prepareBatch,
    processSingle,
    verifyCertificate,
    getIssuanceHistory
};
