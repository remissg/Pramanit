const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_TEMPLATES = [
    {
        name: 'Professional Award',
        subject: 'Attached: Your Official Certificate for {{event_name}}',
        body_html: `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; padding: 32px; color: #0f172a; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
        <span style="background-color: #f3e8ff; color: #6d28d9; border: 1px solid #e9d5ff; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Accredited Credential</span>
    </div>
    <h2 style="font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 12px; color: #0f172a;">Official Certificate Awarded</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; font-weight: 500;">Dear <strong>{{name}}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; font-weight: 500;">Congratulations on your achievement! Attached is your official verifiable credential for <strong>{{event_name}}</strong>.</p>
    <div style="background-color: #f8fafc; padding: 16px 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #334155; font-weight: 600;">Issued by: <strong>{{issuer_name}}</strong></p>
    </div>
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">Pramanit Cryptographic Verification Network</p>
</div>
`,
        is_system: true,
        is_default: true
    },
    {
        name: 'Corporate Recognition',
        subject: 'Commendation for Excellence: {{event_name}}',
        body_html: `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; padding: 32px; color: #0f172a; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Corporate Excellence</span>
    </div>
    <h2 style="font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 12px; color: #0f172a;">Commendation of Merit</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">To <strong>{{name}}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">We are pleased to formally recognize your distinguished contribution and performance in <strong>{{event_name}}</strong>. Please find your digital certificate attached.</p>
    <p style="color: #64748b; font-size: 13px; margin-top: 24px;">Regards,<br><strong style="color: #0f172a;">{{issuer_name}}</strong></p>
</div>
`,
        is_system: true,
        is_default: false
    },
    {
        name: 'Modern / Achievement',
        subject: 'You did it! 🎓 Your badge of honor is here',
        body_html: `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; color: #0f172a; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    <div style="font-size: 40px; margin-bottom: 12px;">🎉</div>
    <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 8px; color: #0f172a;">Way to go, {{name}}!</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">You've successfully completed <strong>{{event_name}}</strong>. We are thrilled to present your digital badge of honor.</p>
    <p style="color: #64748b; font-size: 12px;">Cheers,<br><strong style="color: #0f172a;">{{issuer_name}}</strong></p>
</div>
`,
        is_system: true,
        is_default: false
    },
    {
        name: 'Academic Excellence',
        subject: 'Notification of Academic Completion: {{event_name}}',
        body_html: `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; color: #0f172a; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Academic Credential</span>
    </div>
    <h2 style="font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 12px; color: #0f172a;">Certificate of Completion</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">To <strong>{{name}}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Attached is your formal certificate of completion for <strong>{{event_name}}</strong>. This document verifies your academic fulfillment.</p>
    <p style="color: #64748b; font-size: 13px; margin-top: 24px;">Sincerely,<br>Office of Academic Records &bull; <strong style="color: #0f172a;">{{issuer_name}}</strong></p>
</div>
`,
        is_system: true,
        is_default: false
    },
    {
        name: '🇮🇳 79th Independence Day Participation',
        subject: '🇮🇳 Happy 79th Independence Day! Your Certificate of Participation is Here',
        body_html: `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 2px solid #ff9933; border-radius: 24px; padding: 32px; color: #0f172a; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    <div style="font-size: 36px; margin-bottom: 12px;">🇮🇳</div>
    <h2 style="font-size: 24px; font-weight: 900; color: #000080; margin-bottom: 8px;">Happy 79th Independence Day!</h2>
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Dear <strong>{{name}}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Thank you for your energetic participation in our <strong>79th Independence Day Celebrations</strong>. Attached is your official Certificate of Participation.</p>
    <div style="background-color: #fffdf7; border: 1px solid #fde68a; border-radius: 16px; padding: 12px; margin-bottom: 24px; font-size: 12px; font-weight: 800; color: #b45309;">
        Jai Hind! 🇮🇳
    </div>
    <p style="color: #64748b; font-size: 12px;">Warm regards,<br><strong style="color: #0f172a;">{{issuer_name}}</strong></p>
</div>
`,
        is_system: true,
        is_default: false
    }
];

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for seeding...');

        // Clear existing system templates to avoid duplicates
        await EmailTemplate.deleteMany({ is_system: true });
        console.log('Cleared existing system templates.');

        // Insert new base templates
        await EmailTemplate.insertMany(BASE_TEMPLATES);
        console.log('Successfully seeded base templates!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedTemplates();
