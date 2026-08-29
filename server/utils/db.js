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
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
    }
};

connectDB();

module.exports = { mongoose, connectDB };
