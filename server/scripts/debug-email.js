const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

// Mock config matching emailService.js
const targetHost = 'smtp.gmail.com';
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

async function testConnection() {
    console.log('--- Starting Connection Test ---');
    console.log(`User: ${user ? '***' : 'Missing'}`);
    console.log(`Pass: ${pass ? '***' : 'Missing'}`);

    // 1. Test DNS Resolution
    console.log('\n1. Testing DNS Resolution...');
    let resolvedIp = targetHost;
    try {
        const addresses = await dns.promises.resolve4(targetHost);
        console.log(`   Resolved ${targetHost} to:`, addresses);
        if (addresses && addresses.length > 0) {
            resolvedIp = addresses[0];
        }
    } catch (e) {
        console.error('   DNS Resolution Failed:', e.message);
    }
    console.log(`   Using Host: ${resolvedIp}`);

    // 2. Test Transporter Creation
    console.log('\n2. Creating Transporter...');
    const transporterConfig = {
        host: resolvedIp,
        port: 465,
        secure: true, // SSL/TLS
        auth: { user, pass },
        tls: {
            servername: targetHost // Important for TLS verification
        },
        family: 4, // Force IPv4
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        debug: true, // Show SMTP traffic
        logger: true
    };

    const transporter = nodemailer.createTransport(transporterConfig);

    // 3. Verify Connection
    console.log('\n3. Verifying Connection...');
    try {
        await transporter.verify();
        console.log('   ✅ Connection Verified Successfully!');
    } catch (error) {
        console.error('   ❌ Connection Failed:', error);
    }
}

testConnection();
