const { sendEmail } = require('./emailService');
const getClientUrl = () => {
    return process.env.FRONTEND_URL
        ? `https://${process.env.FRONTEND_URL}`
        : 'http://localhost:5173';
};

// Enhanced certificate email with issuer contact information and custom content
const sendCertificateEmail = async (to, certId, issuerInfo, attachments = [], customSubject = '', customBody = '') => {
    const clientUrl = getClientUrl();
    const verifyUrl = `${clientUrl}/verify/${certId}`;
    const contactUrl = `${clientUrl}/contact-issuer?cert=${certId}`;

    // Use custom body if provided, otherwise use default message
    const emailContent = customBody || `
        <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Your Certificate is Ready!</h2>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; font-weight: 500;">
            Congratulations! Your certificate has been generated and is attached to this email.
        </p>
    `;

    // Use custom subject if provided, otherwise use default
    const emailSubject = customSubject || `Your Certificate - ${issuerInfo.orgName || 'Certificate Issuer'}`;

    const html = `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 32px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.025em; margin: 0;">Pramanit</h1>
    </div>
    
    <div style="text-align: left; margin-bottom: 32px; line-height: 1.6;">
        ${emailContent}
    </div>

    <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
        <h3 style="color: #1e293b; font-size: 18px; margin-bottom: 16px;">Certificate Details:</h3>
        <p><strong>Certificate ID:</strong> ${certId}</p>
        <p><strong>Issued by:</strong> ${issuerInfo.name || 'Certificate Issuer'}</p>
        <p><strong>Organization:</strong> ${issuerInfo.orgName || 'N/A'}</p>
        <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: #ffffff; padding: 16px 40px; border-radius: 16px; font-weight: 800; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
            Verify Certificate
        </a>
    </div>

    <!-- IMPORTANT: Contact Information Section -->
    <div style="background-color: #fef3c7; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #fcd34d;">
        <h3 style="color: #92400e; font-size: 18px; margin-bottom: 16px;">Need Certificate Corrections?</h3>
        <p style="color: #78350f; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            <strong>Important:</strong> For any certificate corrections, name changes, or issues, please contact the certificate issuer directly. The issuer who issued your certificate can help you with:
        </p>
        <ul style="color: #78350f; font-size: 16px; line-height: 1.6; margin-left: 20px; margin-bottom: 16px;">
            <li>Name corrections</li>
            <li>Email address changes</li>
            <li>Certificate content updates</li>
            <li>Verification issues</li>
        </ul>
        
        <div style="text-align: center; margin-bottom: 16px;">
            <a href="${contactUrl}" style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2);">
                Contact Certificate Issuer
            </a>
        </div>
        
        <p style="color: #78350f; font-size: 14px; font-style: italic; margin: 0;">
            <strong>Do not reply to this email</strong> - it will not reach the certificate issuer.
        </p>
    </div>

    <div style="text-align: center; padding-top: 32px; border-top: 1px solid #f1f5f9;">
        <p style="color: #94a3b8; font-size: 12px; font-weight: 600; margin: 0;">
            This certificate was issued through Pramanit. For technical issues with the verification system, contact Pramanit support.
        </p>
    </div>
</div>
`;

    return sendEmail(to, emailSubject, html, attachments);
};

module.exports = { sendCertificateEmail };
