const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { sendEmail } = require('../utils/emailService');

// Temporary storage for uploaded files
// In a real app, might use a database to track batches and cloud storage for files
let currentBatch = {
    templatePath: null,
    recipients: [],
};

const processBatch = async (req, res) => {
    try {
        const { subject, body, nameX, nameY, fontSize, fontColor } = req.body;

        // Check if files were uploaded
        if (!req.files || !req.files.template || !req.files.data) {
            return res.status(400).json({ message: 'Missing template or data file' });
        }

        const templatePath = req.files.template[0].path;
        const dataPath = req.files.data[0].path;

        const recipients = [];

        // Parse CSV
        fs.createReadStream(dataPath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().toLowerCase()
            }))
            .on('data', (row) => {
                // Ensure strictly required fields exist (we need email at minimum)
                if (row.email) {
                    // Store the whole row for dynamic replacement
                    // If 'name' is missing but 'recipient' exists, user might map it in template
                    // But for certificate generation we need a specific name field.
                    // Let's fallback name to 'name' or 'recipient'
                    if (!row.name && row.recipient) row.name = row.recipient;

                    if (row.name) {
                        recipients.push(row);
                    }
                }
            })
            .on('end', async () => {
                console.log(`Parsed ${recipients.length} recipients.`);

                // Process certificates
                const results = {
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

                        // Configure font
                        ctx.font = `${fontSize || 30}px Arial`; // You might want to load a custom font
                        ctx.fillStyle = fontColor || '#000000';
                        ctx.textAlign = 'center'; // Center the text at the coordinates

                        // Draw text
                        // Parse X and Y to numbers
                        const x = parseFloat(nameX);
                        const y = parseFloat(nameY);

                        ctx.fillText(recipient.name, x, y);

                        // Create buffer
                        const buffer = canvas.toBuffer('image/png');

                        // Send email
                        let personalizedBody = body;
                        Object.keys(recipient).forEach(key => {
                            const regex = new RegExp(`{{${key}}}`, 'gi');
                            personalizedBody = personalizedBody.replace(regex, recipient[key]);
                        });
                        // Fallback for {name}
                        personalizedBody = personalizedBody.replace(/{name}/gi, recipient.name);

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

                        results.success.push(recipient.email);
                    } catch (err) {
                        console.error(`Failed for ${recipient.email}:`, err);
                        results.failed.push({ email: recipient.email, error: err.message });
                    }
                }

                // Cleanup uploaded files
                try {
                    fs.unlinkSync(templatePath);
                    fs.unlinkSync(dataPath);
                } catch (e) {
                    console.error('Error cleaning up files:', e);
                }

                res.json({ message: 'Batch processing executed', results });
            });

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const sendTestEmail = async (req, res) => {
    try {
        const { email, subject, body } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Target email is required for test.' });
        }

        // Process a dummy customization
        let personalizedBody = body.replace(/{{name}}/gi, 'Test User').replace(/{{.*?}}/g, '[Placeholder]');

        await sendEmail(
            email,
            `[TEST] ${subject}`,
            personalizedBody,
            [] // No attachment for quick text test, or add a dummy one if we want to be fancy later
        );

        res.json({ message: 'Test email sent successfully' });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ message: 'Failed to send test email', error: error.message });
    }
};

module.exports = { processBatch, sendTestEmail };
