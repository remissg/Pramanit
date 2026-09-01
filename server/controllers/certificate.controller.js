const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createCanvas, loadImage, registerFont } = require('canvas');
const XLSX = require('xlsx');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const JSZip = require('jszip');
const { sendEmail } = require('../utils/emailService');
const { sendCertificateEmail } = require('../utils/enhancedEmailService');
const { drawCustomQRCode } = require('../utils/qrRenderer');
const { Worker } = require('worker_threads');

const User = require('../models/User');
const Design = require('../models/Design');
const IssuanceHistory = require('../models/IssuanceHistory');
const Verification = require('../models/Verification');
const BatchReport = require('../models/BatchReport');
const OtpToken = require('../models/OtpToken');
const ScheduledBatch = require('../models/ScheduledBatch');
const webhookService = require('../utils/webhookService');
const { hash, decrypt } = require('../utils/encryption');
const { uploadToCDN } = require('../utils/cloudinaryService');

const logIssuance = async (userId, designId, totalSent, recipientListRef) => {
    try {
        await IssuanceHistory.create({
            user: userId,
            design_id: designId || null,
            total_certificates: totalSent,
            recipient_emails: Array.isArray(recipientListRef) ? recipientListRef : [recipientListRef]
        });
    } catch (e) {
        console.error('Failed to log issuance history:', e);
    }
};

const getSmtpConfig = async (userId) => {
    try {
        const user = await User.findById(userId).select('+gmail_refresh_token +gmail_access_token gmail_email smtp_host smtp_port smtp_user smtp_pass');

        if (user && user.gmail_refresh_token && user.gmail_email) {
            return {
                service: 'gmail-api',
                user: user.gmail_email,
                refreshToken: user.gmail_refresh_token,
                accessToken: user.gmail_access_token
            };
        }

        if (user && user.smtp_host) {
            return {
                host: user.smtp_host,
                port: user.smtp_port || 587,
                user: user.smtp_user,
                pass: user.smtp_pass
            };
        }
    } catch (e) {
        console.error('Failed to fetch user SMTP config:', e);
    }
    return null;
};

const saveVerification = async (record) => {
    try {
        const issuerInfo = record.issuerId ? await User.findById(record.issuerId) : null;
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
            design_id: record.designId,
            rendered_image_url: record.renderedImageUrl,
            template_bg_url: record.templateBgUrl,
            qr_config: record.qrConfig,
            field_data: record.fieldData || {},
            fields: record.fields || [],
            issuer_type: issuerInfo?.issuer_type || 'institution',
            institution_id_number: issuerInfo?.institution_id_number || '',
            official_id_url: issuerInfo?.official_id_url || '',
            verification_status: issuerInfo?.verification_status || 'unverified',
            verified_at: issuerInfo?.verified_at || null
        });
    } catch (e) {
        console.error('Failed to save verification:', e);
    }
};

const drawWatermark = (ctx, canvasWidth, canvasHeight) => {
    // Watermark disabled for all users
    return;
};

const generateHash = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const createPdfWithMetadata = async (imageBuffer, metadata) => {
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(imageBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    pdfDoc.setTitle('Verified Certificate');
    pdfDoc.setAuthor(metadata.issuerName);
    pdfDoc.setSubject(`Credential for ${metadata.recipientName}`);
    pdfDoc.setKeywords(['Pramanit', 'Verified', metadata.certId]);
    pdfDoc.setProducer('Pramanit Pro');
    pdfDoc.setCreator('Pramanit Engine');

    return await pdfDoc.save();
};

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

        let text = field.text || field.label || '';
        if (text.includes('{{') || text.includes('{')) {
            Object.keys(data).forEach(key => {
                const regex = new RegExp(`{{${key}}}|{${key}}`, 'gi');
                text = text.replace(regex, data[key] || '');
            });
            text = text.replace(/{{.*?}}|{.*?}/g, '');
        } else if (field.id) {
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

const renderCertificateToBuffer = async (record) => {
    let canvas, ctx, image;

    // 1. If certificate already has a saved Cloudinary CDN image URL, load & return it directly!
    if (record.rendered_image_url && typeof record.rendered_image_url === 'string' && record.rendered_image_url.startsWith('http')) {
        try {
            const cloudImg = await loadImage(record.rendered_image_url);
            const c = createCanvas(cloudImg.width, cloudImg.height);
            const cx = c.getContext('2d');
            cx.drawImage(cloudImg, 0, 0);
            return c.toBuffer('image/png');
        } catch (e) {
            console.error('Failed to load saved Cloudinary CDN image in renderCertificateToBuffer:', e.message);
        }
    }

    let bgUrl = record.template_bg_url || '';
    let design = (record.design_id && record.design_id.design_json) ? record.design_id.design_json : null;

    if (!bgUrl && design) {
        if (design.backgroundImage && design.backgroundImage.src) {
            bgUrl = design.backgroundImage.src;
        } else if (typeof design.backgroundImage === 'string') {
            bgUrl = design.backgroundImage;
        }
    }

    if (bgUrl && (bgUrl.startsWith('http') || bgUrl.startsWith('data:'))) {
        try {
            image = await loadImage(bgUrl);
        } catch (e) {
            console.error('Failed to load bg image:', e.message);
        }
    }

    if (image || design || record.fields?.length) {
        if (image) {
            canvas = createCanvas(image.width, image.height);
            ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
        } else {
            canvas = createCanvas(1000, 750);
            ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1000, 750);
        }

        const fields = [];
        if (design.objects) {
            design.objects.forEach(obj => {
                if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
                    fields.push({
                        id: obj.id || obj.text,
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

        const data = {
            name: record.recipient_name,
            email: record.getDecryptedEmail ? record.getDecryptedEmail() : record.recipient_email,
            issuer: record.issuer_name,
            date: record.issue_date ? new Date(record.issue_date).toISOString().split('T')[0] : '',
            cert_id: record.cert_id,
        };
        if (record.certificate_title) data.course = record.certificate_title;

        await renderFields(ctx, fields, canvas.width, canvas.height, data);

        // Render QR Code if qr_config is present
        const qrConf = record.qr_config || { isVisible: true, x: 0.85, y: 0.82, size: 90 };
        if (qrConf.isVisible) {
            try {
                const clientUrl = getClientUrl();
                const verifyUrl = `${clientUrl}/verify/${record.cert_id}`;
                const qrSize = (parseFloat(qrConf.size) || 90) * (canvas.width / 800);
                const qrX = parseFloat(qrConf.x) * canvas.width;
                const qrY = parseFloat(qrConf.y) * canvas.height;

                const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                    margin: 1,
                    color: {
                        dark: qrConf.darkColor || qrConf.color?.dark || '#000000',
                        light: qrConf.lightColor || qrConf.color?.light || '#ffffff'
                    }
                });
                const qrImage = await loadImage(qrDataUrl);
                ctx.drawImage(qrImage, qrX - qrSize / 2, qrY - qrSize / 2, qrSize, qrSize);

                // Overlay Org Logo in center of QR Code if available
                const logoUrl = qrConf.logoUrl || record.org_logo_url;
                if (logoUrl) {
                    try {
                        const logoImg = await loadImage(logoUrl);
                        const logoSize = qrSize * 0.24;
                        const logoX = qrX - logoSize / 2;
                        const logoY = qrY - logoSize / 2;

                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(logoX - 3, logoY - 3, logoSize + 6, logoSize + 6);
                        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                    } catch (logoErr) {
                        console.error('QR Logo Overlay Note:', logoErr.message);
                    }
                }
            } catch (qrErr) {
                console.error('Failed to render QR in fallback mode:', qrErr);
            }
        }

        return canvas.toBuffer('image/png');
    } else {
        // FALLBACK: User deleted design or legacy record without CDN URL
        canvas = createCanvas(800, 600);
        ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 16;
        ctx.strokeRect(30, 30, 740, 540);

        ctx.font = 'bold 36px "Inter", sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('CERTIFICATE OF ISSUANCE', 400, 130);

        ctx.font = '20px "Inter", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('This certifies that', 400, 200);

        ctx.font = 'bold 42px "Playfair Display", serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(record.recipient_name || 'Recipient', 400, 270);

        ctx.font = '18px "Inter", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Issued by ${record.issuer_name || 'Pramanit Authority'}`, 400, 340);
        ctx.fillText(`Date: ${record.issue_date ? new Date(record.issue_date).toISOString().split('T')[0] : ''}`, 400, 380);

        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#6366f1';
        ctx.fillText(`Certificate ID: ${record.cert_id}`, 400, 440);

        // Render QR Code on Fallback Certificate
        try {
            const clientUrl = getClientUrl();
            const verifyUrl = `${clientUrl}/verify/${record.cert_id}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1 });
            const qrImage = await loadImage(qrDataUrl);
            ctx.drawImage(qrImage, 660, 450, 100, 100);
        } catch (e) {}

        return canvas.toBuffer('image/png');
    }
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

        const originalName = req.file.originalname || '';
        // Strip extension (.png, .jpg, .jpeg, .svg, .webp)
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        // Replace underscores and hyphens with spaces, clean multiple spaces
        const suggestedTitle = nameWithoutExt
            .replace(/[_|-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        res.json({
            templatePath: req.file.path,
            originalName,
            suggestedTitle: suggestedTitle || 'Certificate Template'
        });
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

        const branding = req.user?.id ? await User.findById(req.user.id) : null;
        const prefix = (branding?.cert_prefix || 'CERT').trim().toUpperCase();
        const certId = `${prefix}-${crypto.randomUUID()}`;
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
            const logoUrl = (qrConfig.showLogo ?? true) ? (qrConfig.logoUrl || branding?.org_logo_url) : null;

            await drawCustomQRCode(ctx, qrX, qrY, qrSize, qrConfig, verifyUrl, logoUrl, certId);
        }

        // Render Watermark for Free Tier
        if (branding?.plan_type === 'free') {
            drawWatermark(ctx, canvas.width, canvas.height);
        }

        const imageBuffer = canvas.toBuffer('image/png');

        // Upload final rendered certificate image to Cloudinary CDN for persistent storage
        let renderedImageUrl = '';
        try {
            const cdnResult = await uploadToCDN(imageBuffer, 'pramanit/certificates');
            if (cdnResult && cdnResult.secure_url) {
                renderedImageUrl = cdnResult.secure_url;
            }
        } catch (cdnErr) {
            console.error('Cloudinary CDN upload note:', cdnErr.message || cdnErr);
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
            recipientToken,
            designId,
            renderedImageUrl,
            qrConfig,
            fieldData: recData,
            fields: fields || []
        });
        const pdfContent = await createPdfWithMetadata(imageBuffer, {
            certId,
            recipientName: recipient.name || 'Recipient',
            issuerName: issuerName || 'CertiFlow User',
            verifyUrl
        });

        // Personalize body and subject using ALL keys in recipient data (both raw and normalized)
        let personalizedBody = body || '';
        let personalizedSubject = subject || '';

        // Build a comprehensive merge tag dictionary
        const mergedData = {
            ...recData,
            name: recipient.name || recData.name || recData.recipient_name || 'Recipient',
            email: recipient.email || recData.email || '',
            cert_id: certId,
            certId: certId,
            verify_url: verifyUrl,
            verifyUrl: verifyUrl,
            certificate_link: verifyUrl,
            portal_link: portalUrl,
            portalUrl: portalUrl,
            issuer_name: branding?.full_name || issuerName || 'CertiFlow User',
            org_name: branding?.org_name || '',
            issuer_designation: branding?.designation || '',
            issue_date: new Date().toLocaleDateString(undefined, { dateStyle: 'long' }),
            event_name: recData.course || recData.course || recData.event || recData.event || recData.title || ''
        };

        // Replace all merge tags formatted as {{key}}, {key}, %key%, or [[key]] (case-insensitive)
        Object.keys(mergedData).forEach(key => {
            const rawVal = mergedData[key];
            const val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
            // Escape special regex characters in key name
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Regex for {{key}}, {key}, %key%, [[key]]
            const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}|{\\s*${escapedKey}\\s*}|%${escapedKey}%|\\[\\[\\s*${escapedKey}\\s*\\]\\]`, 'gi');
            personalizedBody = personalizedBody.replace(regex, val);
            personalizedSubject = personalizedSubject.replace(regex, val);
        });

        // TYPO GUARD: Auto-correct "Congradulation" if present
        personalizedSubject = personalizedSubject.replace(/Congradulation/gi, 'Congratulations');
        personalizedBody = personalizedBody.replace(/Congradulation/gi, 'Congratulations');


        // Check for email using the normalized 'email' key
        // We already normalized keys to lowercase in recData, so 'Email' became 'email'
        if (recData.email) {
            try {
                console.log(`[Controller] Attempting to send email to ${recData.email}...`);

                // Use enhanced email template with issuer contact information
                const issuerInfo = {
                    name: branding?.full_name || 'Certificate Issuer',
                    orgName: branding?.org_name || '',
                    email: branding?.email || '',
                    designation: branding?.designation || ''
                };

                await sendCertificateEmail(
                    recData.email,
                    certId,
                    issuerInfo,
                    [
                        {
                            filename: `certificate-${(mergedData.name || 'document').replace(/\\s+/g, '_')}.pdf`,
                            content: Buffer.from(pdfContent),
                        },
                    ],
                    personalizedSubject, // Issuer's custom subject with merge tags replaced
                    personalizedBody, // Issuer's custom body with merge tags replaced
                    new Date()
                );
            } catch (emailError) {
                console.error('Email sending failed (Non-blocking):', emailError);
                // We proceed without throwing, enabling the certificate to be returned
                // potentially adding a flag to the response
                let errorMsg = 'Email sending failed. Please download manually.';

                if (emailError.code === 403 || emailError.message.includes('scope') || emailError.message.includes('permission')) {
                    errorMsg = 'Email failed: Insufficient Gmail permissions. Please reconnect your Gmail account in Settings.';
                } else if (emailError.code === 'ETIMEDOUT' || emailError.message.includes('formatted')) {
                    errorMsg = 'Email failed: Connection timeout. Please check your network or try again.';
                }

                return res.json({
                    success: true,
                    email: recData.email,
                    emailSent: false,
                    message: `Certificate generated. WARNING: ${errorMsg}`
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
        const workerPath = path.join(__dirname, '../workers/certificate.worker.optimized.js');
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
                    emailBody: body,
                    designId: req.body.designId // Pass designId to worker
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

        const MAX_WIDTH = 2400;
        const resizeScale = Math.min(1, MAX_WIDTH / image.width);
        const canvasWidth = image.width * resizeScale;
        const canvasHeight = image.height * resizeScale;

        for (const recipient of previewRecipients) {
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvasWidth, canvasHeight);

            const scaleFactor = canvasWidth / 1000;

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
                const verifyUrl = `${clientUrl}/verify/sample-uuid`;
                const logoUrl = (qrConfig.showLogo ?? true) ? (qrConfig.logoUrl || req.user?.org_logo_url || (await User.findById(req.user?.id).select('org_logo_url'))?.org_logo_url) : null;

                await drawCustomQRCode(ctx, qrX, qrY, qrSize, qrConfig, verifyUrl, logoUrl, 'CERT-SAMPLE-UUID');
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
            certificateTitle: record.certificate_title || 'Professional Certificate',
            renderedImageUrl: record.rendered_image_url || `/api/certificates/og-image/${record.cert_id}`
        });
    } catch (e) {
        console.error('Portal access error:', e);
        res.status(500).json({ message: 'Failed to access recipient portal.' });
    }
};

const findCertificatesByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        // Generate blind index
        const emailHash = hash(email.toLowerCase().trim());

        // Find all active certificates for this email
        const records = await Verification.find({
            recipient_email_hash: emailHash,
            status: 'active'
        }).sort({ issue_date: -1 });

        if (records.length === 0) {
            return res.status(404).json({ message: 'No active certificates found for this email address.' });
        }

        const formattedCertificates = records.map(r => ({
            certId: r.cert_id,
            recipientName: r.recipient_name,
            recipientEmail: email,
            issuerName: r.issuer_name,
            orgName: r.org_name || r.issuer_name,
            orgLogoUrl: r.org_logo_url,
            issueDate: r.issue_date,
            certificateTitle: r.certificate_title || 'Certificate of Achievement',
            renderedImageUrl: r.rendered_image_url || `/api/certificates/og-image/${r.cert_id}`,
            recipientToken: r.recipient_token,
            correctionRequested: r.correction_requested,
            correctionStatus: r.correction_status,
            status: r.status
        }));

        res.json({
            success: true,
            count: formattedCertificates.length,
            message: `Found ${formattedCertificates.length} certificate(s).`,
            certificates: formattedCertificates
        });
    } catch (e) {
        console.error('Certificate recovery error:', e);
        res.status(500).json({ message: 'Failed to process recovery request.' });
    }
};

const requestRecipientOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const emailNorm = email.toLowerCase().trim();
        const emailHash = hash(emailNorm);

        // Check if certificates exist
        const records = await Verification.find({ recipient_email_hash: emailHash, status: 'active' });
        if (records.length === 0) {
            return res.status(404).json({ message: 'No active certificates found for this email address.' });
        }

        // Generate 6-digit PIN
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

        // Remove previous OTPs for this email hash
        await OtpToken.deleteMany({ email_hash: emailHash });

        // Save new OTP
        await OtpToken.create({
            email_hash: emailHash,
            otp_hash: otpHash
        });

        const otpHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Credential Vault Verification PIN</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 36px 40px 24px 40px; text-align: center; background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%); border-b: 1px solid #f1f5f9;">
                            <div style="font-size: 26px; font-weight: 900; color: #d97706; letter-spacing: -0.5px; line-height: 1;">🔑 Pramanit</div>
                            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px;">Credential Vault Verification</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Vault Access Verification</h1>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; font-weight: 500;">
                                Use the 6-digit security PIN below to unlock your accredited certificate vault and view your verifiable credentials:
                            </p>

                            <!-- Copy-Friendly PIN Display Box -->
                            <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 20px; padding: 24px 16px; margin-bottom: 24px;">
                                <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; color: #b45309; letter-spacing: 12px; margin-left: 12px;">
                                    ${otpCode}
                                </div>
                            </div>

                            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                                Enter this code into your portal verification screen to unlock your vault.
                            </p>
                        </td>
                    </tr>

                    <!-- Expiration Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                ⏳ This PIN is valid for <strong style="color: #b45309;">10 minutes</strong>.<br>
                                If you did not request access to your credential vault, please ignore this email.
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

        // Email OTP code to recipient
        console.log(`[PRAMANIT OTP] Sent verification PIN ${otpCode} to ${emailNorm}`);
        try {
            await sendEmail(emailNorm, 'Your Credential Vault Verification PIN - Pramanit', otpHtml);
        } catch (emailErr) {
            console.error('SMTP Email failed (fallback to console PIN):', emailErr.message);
        }

        res.json({ success: true, message: `A 6-digit verification PIN has been sent to ${emailNorm}.` });
    } catch (e) {
        console.error('Request OTP error:', e);
        res.status(500).json({ message: 'Failed to send verification PIN.' });
    }
};

const verifyRecipientOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and 6-digit PIN are required.' });

        const emailNorm = email.toLowerCase().trim();
        const emailHash = hash(emailNorm);
        const otpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');

        const otpRecord = await OtpToken.findOne({ email_hash: emailHash, otp_hash: otpHash });

        if (!otpRecord) {
            return res.status(401).json({ message: 'Invalid or expired 6-digit PIN. Please try again.' });
        }

        // Delete used OTP
        await OtpToken.deleteOne({ _id: otpRecord._id });

        // Fetch recipient's active certificates
        const records = await Verification.find({
            recipient_email_hash: emailHash,
            status: 'active'
        }).sort({ issue_date: -1 });

        const formattedCertificates = records.map(r => ({
            certId: r.cert_id,
            recipientName: r.recipient_name,
            recipientEmail: emailNorm,
            issuerName: r.issuer_name,
            orgName: r.org_name || r.issuer_name,
            orgLogoUrl: r.org_logo_url,
            issueDate: r.issue_date,
            certificateTitle: r.certificate_title || 'Certificate of Achievement',
            renderedImageUrl: r.rendered_image_url || `/api/certificates/og-image/${r.cert_id}`,
            recipientToken: r.recipient_token,
            correctionRequested: r.correction_requested,
            correctionStatus: r.correction_status,
            status: r.status
        }));

        res.json({
            success: true,
            count: formattedCertificates.length,
            message: 'PIN verified successfully!',
            certificates: formattedCertificates
        });
    } catch (e) {
        console.error('Verify OTP error:', e);
        res.status(500).json({ message: 'Failed to verify PIN.' });
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
            { returnDocument: 'after' }
        );

        // Fetch Issuer Settings & Verification Metadata
        const issuer = await User.findById(updatedRecord.issuer_id).select('social_settings webhook_url issuer_type verification_status official_id_url institution_id_number verified_at');

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
            socialSettings: issuer?.social_settings || { allow_sharing: true, default_hashtags: '' },
            // Verified Identity Metadata
            issuerType: issuer?.issuer_type || updatedRecord.issuer_type || 'institution',
            verificationStatus: issuer?.verification_status || updatedRecord.verification_status || 'unverified',
            institutionIdNumber: issuer?.institution_id_number || updatedRecord.institution_id_number || '',
            officialIdUrl: issuer?.official_id_url || updatedRecord.official_id_url || '',
            verifiedAt: issuer?.verified_at || updatedRecord.verified_at || null
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
        const userId = req.user.id;

        // 1. Fetch raw issuance history strictly for this authenticated issuer
        const rawHistory = await IssuanceHistory.find({ user: userId })
            .populate('design_id', 'name')
            .sort({ timestamp: -1 });

        // 2. Fetch verification records issued by this user for cross-referencing
        const verifications = await Verification.find({ issuer_id: userId })
            .sort({ issue_date: -1 });

        // Map verifications with decrypted email for quick lookup
        const verificationDetailsMap = verifications.map(v => ({
            id: v._id,
            cert_id: v.cert_id,
            recipient_name: v.recipient_name,
            recipient_email: decrypt(v.recipient_email),
            issue_date: v.issue_date || v.created_at,
            status: v.status || 'active',
            scan_count: v.scan_count || 0,
            recipient_token: v.recipient_token,
            org_name: v.org_name,
            issuer_name: v.issuer_name,
            issuer_designation: v.issuer_designation,
            issuer_email: v.issuer_email,
            rendered_image_url: v.rendered_image_url,
            design_id: v.design_id ? String(v.design_id) : null
        }));

        // 3. Time-window Consolidation Algorithm for Legacy Single Sends
        // Group items occurring within 10 minutes of each other for the same design
        const consolidated = [];
        const TIME_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

        rawHistory.forEach(record => {
            const recordTime = new Date(record.timestamp).getTime();
            const designIdStr = record.design_id ? String(record.design_id._id || record.design_id) : (record.design_name || 'Direct Generation');
            const decryptedEmails = (record.recipient_emails || []).map(e => decrypt(e));

            // Check if there is an existing consolidated batch in the time window
            let existingBatch = consolidated.find(batch => {
                const batchTime = new Date(batch.timestamp).getTime();
                const timeDiff = Math.abs(batchTime - recordTime);
                return batch.design_key === designIdStr && timeDiff <= TIME_WINDOW_MS;
            });

            if (existingBatch) {
                existingBatch.total_certificates += (record.total_certificates || 1);
                existingBatch.total_sent += (record.total_certificates || 1);
                decryptedEmails.forEach(e => {
                    if (e && !existingBatch.recipient_emails.includes(e)) {
                        existingBatch.recipient_emails.push(e);
                    }
                });
            } else {
                consolidated.push({
                    id: record._id,
                    design_key: designIdStr,
                    design_name: record.design_id ? record.design_id.name : (record.design_name || 'Deleted Design'),
                    total_certificates: record.total_certificates || decryptedEmails.length || 1,
                    total_sent: record.total_certificates || decryptedEmails.length || 1,
                    recipient_emails: [...decryptedEmails],
                    timestamp: record.timestamp
                });
            }
        });

        // 4. Attach matching full verification items to each consolidated batch
        const formatted = consolidated.map(batch => {
            const batchTime = new Date(batch.timestamp).getTime();
            const matchingVerifications = verificationDetailsMap.filter(v => {
                const vTime = new Date(v.issue_date).getTime();
                const timeDiff = Math.abs(vTime - batchTime);
                const emailMatch = batch.recipient_emails.includes(v.recipient_email);
                return emailMatch || (timeDiff <= 15 * 60 * 1000);
            });

            // Build detailed recipients list
            const recipientDetails = batch.recipient_emails.map((email, idx) => {
                const foundV = matchingVerifications.find(v => v.recipient_email === email);
                if (foundV) {
                    return {
                        cert_id: foundV.cert_id,
                        recipient_name: foundV.recipient_name,
                        recipient_email: email,
                        issue_date: foundV.issue_date,
                        status: foundV.status,
                        scan_count: foundV.scan_count,
                        recipient_token: foundV.recipient_token,
                        org_name: foundV.org_name,
                        issuer_name: foundV.issuer_name,
                        issuer_designation: foundV.issuer_designation,
                        issuer_email: foundV.issuer_email,
                        rendered_image_url: foundV.rendered_image_url || `/api/certificates/og-image/${foundV.cert_id}`
                    };
                }
                const fallbackCertId = `CERT-${batch.id.toString().substring(0, 8)}-${idx + 1}`;
                return {
                    cert_id: fallbackCertId,
                    recipient_name: 'Recipient',
                    recipient_email: email,
                    issue_date: batch.timestamp,
                    status: 'active',
                    scan_count: 0,
                    recipient_token: null,
                    rendered_image_url: `/api/certificates/og-image/${fallbackCertId}`
                };
            });

            const firstWithIssuer = recipientDetails.find(r => r.issuer_name || r.org_name);

            const totalScans = recipientDetails.reduce((acc, r) => acc + (r.scan_count || 0), 0);
            const deliveryRate = 100; // Successful SMTP dispatches
            const openRate = Math.min(100, Math.round(((totalScans + recipientDetails.length * 0.75) / (recipientDetails.length || 1)) * 100));

            return {
                id: batch.id,
                design_name: batch.design_name,
                total_certificates: recipientDetails.length,
                total_sent: recipientDetails.length,
                delivery_rate: deliveryRate,
                open_rate: openRate,
                verification_scans: totalScans,
                recipient_emails: batch.recipient_emails,
                recipient_details: recipientDetails,
                issuer_info: {
                    issuer_name: firstWithIssuer?.issuer_name || req.user?.full_name || req.user?.fullName || 'Certificate Issuer',
                    org_name: firstWithIssuer?.org_name || req.user?.org_name || req.user?.orgName || 'Organization',
                    issuer_designation: firstWithIssuer?.issuer_designation || req.user?.designation || 'Issuing Authority',
                    issuer_email: firstWithIssuer?.issuer_email || req.user?.email || ''
                },
                timestamp: batch.timestamp
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error('Get issuance history error:', err);
        res.status(500).json({ message: 'Failed to fetch issuance history' });
    }
};

const logBatchIssuance = async (req, res) => {
    try {
        const { designId, totalSent, recipientEmails, failedEmails } = req.body;
        const userId = req.user.id;

        if (recipientEmails && recipientEmails.length > 0) {
            await logIssuance(userId, designId, totalSent, recipientEmails);
        }

        // Also log to BatchReport for detailed status view
        try {
            const successList = (recipientEmails || []).map(e => ({ email: e, timestamp: new Date() }));
            const failList = (failedEmails || []).map(f => ({
                email: typeof f === 'string' ? f : (f.email || 'Unknown'),
                reason: f.error || 'Failed to send',
                timestamp: new Date()
            }));

            await BatchReport.create({
                user: userId,
                design_id: designId || null,
                total_recipients: totalSent + failList.length,
                successful_sends: successList.length,
                failed_sends: failList.length,
                successful_emails: successList,
                failed_emails: failList,
                status: 'completed',
                completion_time: new Date()
            });
        } catch (reportErr) {
            console.error('BatchReport creation notice:', reportErr.message);
        }

        res.json({ success: true, message: 'Batch logged successfully' });
    } catch (err) {
        console.error('Log batch issuance error:', err);
        res.status(500).json({ message: 'Failed to log batch issuance' });
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

        if (record.rendered_image_url && typeof record.rendered_image_url === 'string' && record.rendered_image_url.startsWith('http')) {
            return res.redirect(record.rendered_image_url);
        }

        const imageBuffer = await renderCertificateToBuffer(record);
        res.setHeader('Content-Type', 'image/png');
        // Cache for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(imageBuffer);

    } catch (e) {
        console.error('OG Image generation error:', e);
        res.status(500).send('Failed to generate image');
    }
};

const downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Verification.findOne({ cert_id: id }).populate('design_id');

        if (!record) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        const imageBuffer = await renderCertificateToBuffer(record);
        const pdfBuffer = await createPdfWithMetadata(imageBuffer, {
            certId: record.cert_id,
            recipientName: record.recipient_name,
            issuerName: record.issuer_name,
            verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${record.cert_id}`
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${record.recipient_name.replace(/\s+/g, '_')}.pdf"`);
        res.send(Buffer.from(pdfBuffer));

    } catch (e) {
        console.error('PDF Download error:', e);
        res.status(500).json({ message: 'Failed to generate PDF' });
    }
};

const revokeCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const record = await Verification.findOne({ cert_id: id, issuer_id: userId });

        if (!record) {
            return res.status(404).json({ message: 'Certificate not found or unauthorized' });
        }

        record.status = 'revoked';
        await record.save();

        res.json({
            message: 'Certificate revoked successfully',
            certId: record.cert_id,
            status: record.status
        });
    } catch (error) {
        console.error('Revoke certificate error:', error);
        res.status(500).json({ message: 'Failed to revoke certificate' });
    }
};

const exportBatchZip = async (req, res) => {
    try {
        const { batchId } = req.params;
        const userId = req.user.id;

        const records = await Verification.find({ batch_id: batchId, issuer_id: userId }).populate('design_id');

        if (!records || records.length === 0) {
            return res.status(404).json({ message: 'No certificates found for this batch' });
        }

        const zip = new JSZip();

        for (const record of records) {
            try {
                const imageBuffer = await renderCertificateToBuffer(record);
                const pdfBuffer = await createPdfWithMetadata(imageBuffer, {
                    certId: record.cert_id,
                    recipientName: record.recipient_name,
                    issuerName: record.issuer_name,
                    verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${record.cert_id}`
                });

                const sanitizedName = (record.recipient_name || 'recipient').replace(/[^a-zA-Z0-9_-]/g, '_');
                const filename = `${sanitizedName}_${record.cert_id.slice(0, 8)}.pdf`;
                zip.file(filename, pdfBuffer);
            } catch (err) {
                console.error(`Failed to add ${record.cert_id} to ZIP:`, err);
            }
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="batch-${batchId.slice(0, 8)}.zip"`);
        res.send(zipBuffer);
    } catch (error) {
        console.error('Export batch ZIP error:', error);
        res.status(500).json({ message: 'Failed to generate batch ZIP archive' });
    }
};

const correctCertificateInPerson = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { recipientName, recipientEmail, fieldData } = req.body;

        const record = await Verification.findOne({ cert_id: id, issuer_id: userId }).populate('design_id');

        if (!record) {
            return res.status(404).json({ message: 'Certificate not found or unauthorized' });
        }

        if (recipientName) record.recipient_name = recipientName;
        if (recipientEmail) record.recipient_email = recipientEmail;

        if (fieldData && typeof fieldData === 'object') {
            record.field_data = { ...(record.field_data || {}), ...fieldData };
        }

        // Re-render certificate image canvas with updated fields
        const imageBuffer = await renderCertificateToBuffer(record);

        // Re-upload updated image to Cloudinary CDN
        try {
            const cdnResult = await uploadToCDN(imageBuffer, 'pramanit/certificates');
            if (cdnResult && cdnResult.secure_url) {
                record.rendered_image_url = cdnResult.secure_url;
            }
        } catch (cdnErr) {
            console.error('Cloudinary CDN update note:', cdnErr.message || cdnErr);
        }

        record.correction_status = 'approved';
        await record.save();

        // Optionally send updated PDF email
        const targetEmail = recipientEmail || (record.getDecryptedEmail ? record.getDecryptedEmail() : '');
        if (targetEmail) {
            try {
                const pdfBuffer = await createPdfWithMetadata(imageBuffer, {
                    certId: record.cert_id,
                    recipientName: record.recipient_name,
                    issuerName: record.issuer_name,
                    verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${record.cert_id}`
                });

                await sendCertificateEmail({
                    to: targetEmail,
                    subject: `Updated: Your Official Certificate (${record.recipient_name})`,
                    bodyHtml: `<p>Dear <strong>${record.recipient_name}</strong>,</p><p>Your certificate details have been updated by the issuing authority. Attached is your updated official credential.</p>`,
                    pdfBuffer,
                    filename: `certificate-${record.recipient_name.replace(/\s+/g, '_')}.pdf`,
                    userId
                });
            } catch (emailErr) {
                console.error('Re-issuance email note:', emailErr.message || emailErr);
            }
        }

        res.json({
            message: 'Certificate updated and re-issued successfully',
            certificate: {
                cert_id: record.cert_id,
                recipient_name: record.recipient_name,
                recipient_email: targetEmail,
                rendered_image_url: record.rendered_image_url,
                field_data: record.field_data
            }
        });
    } catch (error) {
        console.error('In-person correction error:', error);
        res.status(500).json({ message: 'Failed to update certificate' });
    }
};

const getAdminAllCredentials = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }

        const verifications = await Verification.find({})
            .populate('issuer_id', 'org_name full_name email designation verification_category issuer_type official_id_url institution_name institution_id_number website faculty_email student_roll_number profile_completed verification_status verified_at')
            .sort({ issue_date: -1, created_at: -1 })
            .limit(200);

        const list = verifications.map(v => {
            let emailDecrypted = 'N/A';
            try {
                emailDecrypted = decrypt(v.recipient_email);
            } catch (e) {
                emailDecrypted = v.recipient_email || 'N/A';
            }

            const issuer = v.issuer_id || {};

            return {
                id: v.cert_id || String(v._id),
                cert_id: v.cert_id,
                recipientName: v.recipient_name || 'Recipient',
                recipientEmail: emailDecrypted,
                orgName: v.org_name || issuer.org_name || 'Verified Issuer',
                issuerName: v.issuer_name || issuer.full_name || 'Signer',
                issuerEmail: v.issuer_email || issuer.email || 'N/A',
                issuerDesignation: v.issuer_designation || issuer.designation || 'N/A',
                orgLogoUrl: v.org_logo_url || issuer.org_logo_url || '',
                issueDate: v.issue_date || v.created_at || Date.now(),
                status: v.status || 'active',
                scanCount: v.scan_count || 0,
                renderedImageUrl: v.rendered_image_url || '',

                // Full Issuer Details for Admin Review Modal & Table
                verificationCategory: issuer.verification_category || v.issuer_type || 'Official Institution',
                issuerType: v.issuer_type || issuer.issuer_type || 'institution',
                institutionName: issuer.institution_name || 'N/A',
                website: issuer.website || 'N/A',
                facultyEmail: issuer.faculty_email || 'N/A',
                studentRollNumber: issuer.student_roll_number || 'N/A',
                institutionIdNumber: v.institution_id_number || issuer.institution_id_number || 'N/A',
                officialIdUrl: v.official_id_url || issuer.official_id_url || '',
                verificationStatus: v.verification_status || issuer.verification_status || 'unverified',
                verifiedAt: v.verified_at || issuer.verified_at || null,
                profileCompleted: issuer.profile_completed || false,
                fieldData: v.field_data || {}
            };
        });

        res.json(list);
    } catch (err) {
        console.error('Admin all credentials fetch error:', err);
        res.status(500).json({ message: 'Failed to fetch global credentials' });
    }
};

const scheduleBatch = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            designId,
            designName,
            scheduledFor,
            dispatchPace,
            recipientsData,
            emailConfig,
            designConfig
        } = req.body;

        if (!scheduledFor || !recipientsData || !recipientsData.length) {
            return res.status(400).json({ message: 'Scheduled date/time and recipient data are required.' });
        }

        const scheduledDate = new Date(scheduledFor);
        if (isNaN(scheduledDate.getTime())) {
            return res.status(400).json({ message: 'Invalid target date/time format.' });
        }

        const newScheduledBatch = await ScheduledBatch.create({
            user: userId,
            design_id: designId || null,
            design_name: designName || 'Certificate Template',
            scheduled_for: scheduledDate,
            dispatch_pace: dispatchPace || 'safe',
            recipients_data: recipientsData,
            email_config: emailConfig || {},
            design_config: designConfig || {},
            total_recipients: recipientsData.length,
            status: 'scheduled'
        });

        res.json({
            message: `Batch successfully scheduled for ${scheduledDate.toLocaleString()}`,
            scheduledBatch: newScheduledBatch
        });
    } catch (err) {
        console.error('Schedule batch error:', err);
        res.status(500).json({ message: 'Failed to schedule batch dispatch.' });
    }
};

const getScheduledBatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const batches = await ScheduledBatch.find({ user: userId }).sort({ created_at: -1 });
        res.json(batches);
    } catch (err) {
        console.error('Get scheduled batches error:', err);
        res.status(500).json({ message: 'Failed to fetch scheduled batches.' });
    }
};

const cancelScheduledBatch = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const batch = await ScheduledBatch.findOne({ _id: id, user: userId });
        if (!batch) {
            return res.status(404).json({ message: 'Scheduled batch not found.' });
        }

        if (batch.status === 'processing') {
            return res.status(400).json({ message: 'Cannot cancel a batch that is currently processing.' });
        }

        batch.status = 'cancelled';
        await batch.save();

        res.json({ message: 'Scheduled batch cancelled successfully.' });
    } catch (err) {
        console.error('Cancel scheduled batch error:', err);
        res.status(500).json({ message: 'Failed to cancel scheduled batch.' });
    }
};

const runBatchNow = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const batch = await ScheduledBatch.findOne({ _id: id, user: userId });
        if (!batch) {
            return res.status(404).json({ message: 'Scheduled batch not found.' });
        }

        // Set scheduled_for to now to trigger immediate pick-up
        batch.scheduled_for = new Date();
        batch.status = 'scheduled';
        await batch.save();

        // Process immediately
        const { processDueBatches } = require('../services/batchScheduler');
        processDueBatches();

        res.json({ message: 'Scheduled batch triggered for immediate dispatch.' });
    } catch (err) {
        console.error('Run batch now error:', err);
        res.status(500).json({ message: 'Failed to trigger batch dispatch.' });
    }
};

module.exports = {
    prepareBatch,
    processSingle,
    processCertificates,
    previewBatch,
    getIssuanceHistory,
    logBatchIssuance,
    verifyCertificate,
    getRecipientPortal,
    requestCorrection,
    getCorrectionRequests,
    handleCorrectionAction,
    sendEmail: sendTestEmail,
    getCertificateOGImage,
    findCertificatesByEmail,
    downloadCertificate,
    revokeCertificate,
    exportBatchZip,
    correctCertificateInPerson,
    requestRecipientOtp,
    verifyRecipientOtp,
    getAdminAllCredentials,
    scheduleBatch,
    getScheduledBatches,
    cancelScheduledBatch,
    runBatchNow
};
