const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Force IPv4 DNS resolution first to avoid MongoDB Atlas ENOTFOUND/connection errors on Windows dual-stack networks
try {
    dns.setDefaultResultOrder('ipv4first');
} catch (e) {
    // Fallback if not supported
}

dotenv.config();

const connectDB = async () => {
    try {
        mongoose.connection.on('disconnected', () => {
            console.log('[MongoDB] Connection lost. Attempting auto-reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('[MongoDB] Reconnected successfully.');
        });

        mongoose.connection.on('error', (err) => {
            console.error('[MongoDB] Connection Error:', err.message);
        });

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4 to prevent Windows dual-stack ENOTFOUND DNS lookup failures
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Initial Connection Error:', err.message);
    }
};

module.exports = { mongoose, connectDB };
