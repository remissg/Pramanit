const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createCanvas, loadImage, registerFont } = require('canvas');
const XLSX = require('xlsx');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const { sendEmail } = require('../utils/emailService');

const db = require('../utils/db');

const saveVerification = async (record) => {
    try {
        await db.query(`
            INSERT INTO verifications (
                cert_id, recipient_name, recipient_email, issuer_name, 
                issue_date, data_hash, status, scan_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
        `, [
            record.certId,
            record.recipientName,
            record.recipientEmail,
            record.issuerName,
            record.issueDate,
            record.dataHash,
            record.status
        ]);
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

    // Add custom metadata (XMP equivalent is harder, so we stick to standard fields)
    // We can also abuse the Producer field or others if needed

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
        const { templatePath, recipient, fields, subject, body, issuerName, qrConfig } = req.body;

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
            recipient: recipient.name || recipient.email,
            fields: fields.filter(f => f.isVisible),
            issuerName,
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

        // Save Verification Record
        await saveVerification({
            certId,
            recipientName: recipient.name || 'Recipient',
            recipientEmail: recipient.email || '',
            issuerName: issuerName || 'CertiFlow User',
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

        // Personalize body using all keys in recipient data
        let personalizedBody = body || '';
        const recData = recipient.data || recipient;

        // Add verification info to personalization
        const mergedData = { ...recData, cert_id: certId, verify_url: verifyUrl };

        Object.keys(mergedData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'gi');
            personalizedBody = personalizedBody.replace(regex, mergedData[key]);
        });

        if (recData.email) {
            await sendEmail(
                recData.email,
                subject || 'Your Certificate',
                personalizedBody,
                [
                    {
                        filename: `certificate-${(recData.name || 'document').replace(/\s+/g, '_')}.pdf`,
                        content: Buffer.from(pdfContent),
                    },
                ]
            );
        }

        res.json({ success: true, email: recData.email });

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
                    await sendEmail(
                        recipient.email,
                        subject || 'Your Certificate',
                        personalizedBody,
                        [
                            {
                                filename: `certificate-${recipient.name.replace(/\s+/g, '_')}.png`,
                                content: buffer,
                            },
                        ]
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

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const sendTestEmail = async (req, res) => {
    try {
        const { email, subject, body } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Target email is required.' });
        }

        let personalizedBody = body ? body.replace(/{{name}}/gi, 'Test User').replace(/{{.*?}}/g, '[Placeholder]') : 'Test Body';

        await sendEmail(
            email,
            `[TEST] ${subject || 'No Subject'}`,
            personalizedBody,
            []
        );

        res.json({ message: 'Test email sent successfully' });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ message: 'Failed to send test email', error: error.message });
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

        // Fetch record
        const result = await db.query('SELECT * FROM verifications WHERE cert_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Certificate not found or invalid id.' });
        }

        const record = result.rows[0];

        // Increment scan count atomically
        await db.query('UPDATE verifications SET scan_count = scan_count + 1 WHERE cert_id = $1', [id]);

        // Map snake_case DB fields to camelCase for frontend
        res.json({
            certId: record.cert_id,
            recipientName: record.recipient_name,
            recipientEmail: record.recipient_email,
            issuerName: record.issuer_name,
            issueDate: record.issue_date,
            scanCount: (record.scan_count || 0) + 1, // Return incremented value
            status: record.status
        });

    } catch (e) {
        console.error('Verify error:', e);
        res.status(500).json({ message: 'Failed to verify certificate.' });
    }
};

module.exports = {
    processCertificates,
    sendEmail: sendTestEmail,
    previewBatch,
    prepareBatch,
    processSingle,
    verifyCertificate
};
