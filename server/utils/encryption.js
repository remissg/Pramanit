const crypto = require('crypto');

// Get key from env and ensure it's 32 bytes (256 bits)
const algorithm = 'aes-256-cbc';

// Helper to get key buffer
const getKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new Error('ENCRYPTION_KEY is not defined in .env');
    return Buffer.from(key, 'hex');
};

exports.encrypt = (text) => {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

exports.decrypt = (text) => {
    if (!text) return text;
    // Check if text is encrypted (contains colon)
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Assume already decrypted or legacy data

    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Deterministic hash for searching (Blind Index)
exports.hash = (text) => {
    if (!text) return text;
    return crypto.createHmac('sha256', getKey())
        .update(text)
        .digest('hex');
};
