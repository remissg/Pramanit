const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

try {
    dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '../.env') });

const targetCertIds = [
    'e09815c1-1fe3-48fc-b4bc-ffa34e5f7b44',
    '210fedf1-54e9-4714-a495-514a7e3529af'
];

async function cleanup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            family: 4
        });
        console.log('Connected to MongoDB successfully.');

        const Verification = mongoose.model('Verification', new mongoose.Schema({
            cert_id: String
        }, { collection: 'verifications' }));

        const IssuanceHistory = mongoose.model('IssuanceHistory', new mongoose.Schema({
            certificate_id: String
        }, { collection: 'issuancehistories' }));

        // Delete specified verifications
        const verificationResult = await Verification.deleteMany({ cert_id: { $in: targetCertIds } });
        console.log(`Deleted ${verificationResult.deletedCount} verification record(s) matching specified target IDs.`);

        // Also delete from issuance history if any matches
        const historyResult = await IssuanceHistory.deleteMany({ certificate_id: { $in: targetCertIds } });
        console.log(`Deleted ${historyResult.deletedCount} issuance history record(s) matching specified target IDs.`);

        // Log remaining verification count
        const remainingCount = await Verification.countDocuments({});
        console.log(`Remaining total verifications in database: ${remainingCount}`);

    } catch (err) {
        console.error('Cleanup Script Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

cleanup();
