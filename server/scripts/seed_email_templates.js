const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_TEMPLATES = [
    {
        name: 'Professional Award',
        subject: 'Attached: Your Official Certificate for {{event_name}}',
        body_html: '<p>Dear <strong>{{name}}</strong>,</p><p>Congratulations on your accomplishment! Attached is your official certificate for <strong>{{event_name}}</strong>.</p><p>This credential serves as formal notification of your completion and achievement.</p><p>Best regards,<br><strong>{{issuer_name}}</strong></p>',
        is_system: true,
        is_default: true
    },
    {
        name: 'Corporate Recognition',
        subject: 'Commendation for Excellence: {{event_name}}',
        body_html: '<p>To {{name}},</p><p>We are pleased to formally recognize your distinguished contribution and success in <strong>{{event_name}}</strong>.</p><p>Please find your digital certificate of excellence attached to this email.</p><p>Regards,<br>Corporate HR Division<br><strong>{{issuer_name}}</strong></p>',
        is_system: true,
        is_default: false
    },
    {
        name: 'Modern / Achievement',
        subject: 'You did it! 🎓 Your badge of honor is here',
        body_html: '<div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; font-family: sans-serif;"><h1>Way to go, {{name}}! 🎉</h1><p>You\'ve successfully completed <strong>{{event_name}}</strong>. We\'re thrilled to share your well-deserved badge of honor with you.</p><p>Keep up the amazing work!</p><p>Cheers,<br>The Team at {{issuer_name}}</p></div>',
        is_system: true,
        is_default: false
    },
    {
        name: 'Academic Excellence',
        subject: 'Notification of Academic Completion: {{event_name}}',
        body_html: '<p>To <strong>{{name}}</strong>,</p><p>Please find attached your formal certificate of completion for the academic module <strong>{{event_name}}</strong>.</p><p>This document verifies your successful fulfillment of all required criteria as of today.</p><p>Sincerely,<br>Office of Academic Affairs<br><strong>{{issuer_name}}</strong></p>',
        is_system: true,
        is_default: false
    },
    {
        name: '🇮🇳 79th Independence Day Participation',
        subject: '🇮🇳 Happy 79th Independence Day! Your Certificate of Participation is Here',
        body_html: '<div style="background-color: #fffdf7; border: 2px solid #ff9933; padding: 24px; border-radius: 16px; font-family: Georgia, serif;"><h2 style="color: #000080; margin-top: 0;">Happy 79th Independence Day! 🇮🇳</h2><p>Dear <strong>{{name}}</strong>,</p><p>Thank you for your active participation in our <strong>79th Independence Day Celebrations & Cultural Fest</strong>!</p><p>We are proud to award you this <strong>Certificate of Participation</strong> for your enthusiasm in <strong>{{event_category}}</strong> ({{department}}).</p><p>Your verifiable certificate PDF is attached to this email. You can also view and verify your credential anytime online.</p><p>Jai Hind! 🇮🇳<br>Warm regards,<br><strong>{{issuer_name}}</strong></p></div>',
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
