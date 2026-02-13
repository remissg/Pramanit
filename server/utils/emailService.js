const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, attachments) => {
    try {
        // Create a transporter
        // For production, use environment variables for service, user, and pass
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or use host/port for other providers
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html, // Use HTML body
            text: html.replace(/<[^>]*>?/gm, ''), // Fallback plain text
            attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
