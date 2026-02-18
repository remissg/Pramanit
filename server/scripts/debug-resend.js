const { Resend } = require('resend');
require('dotenv').config();

console.log('--- Resend API Key Debug ---');
console.log('Current working directory:', process.cwd());
console.log('RESEND_API_KEY value:', process.env.RESEND_API_KEY ? 'FOUND' : 'MISSING');

if (!process.env.RESEND_API_KEY) {
    console.error('❌ ERROR: RESEND_API_KEY is undefined. Check your .env file location and format.');
    process.exit(1);
}

try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend client initialized successfully.');

    // Optional: Send a test email
    /*
    (async function() {
      try {
        const data = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: 'delivered@resend.dev',
          subject: 'Hello World',
          html: '<p>Congrats on sending your first email!</p>'
        });
        console.log('Test send result:', data);
      } catch (err) {
        console.error('Test send failed:', err);
      }
    })();
    */

} catch (error) {
    console.error('❌ Resend initialization failed:', error.message);
}
