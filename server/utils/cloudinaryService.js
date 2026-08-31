const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a buffer or file path to Cloudinary
 * @param {Buffer|string} file - The file data or path
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} - The upload result
 */
const uploadToCDN = (file, folder = 'pramanit') => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder,
            resource_type: 'image',
            format: 'png',
            unique_filename: true
        };

        let targetFile = file;

        // If base64 data URL string, convert to Buffer
        if (typeof file === 'string' && file.startsWith('data:image/')) {
            try {
                const base64Data = file.split(';base64,').pop();
                targetFile = Buffer.from(base64Data, 'base64');
            } catch (err) {
                console.error('Base64 buffer conversion error:', err);
            }
        }

        if (Buffer.isBuffer(targetFile)) {
            cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(targetFile);
        } else {
            cloudinary.uploader.upload(targetFile, uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        }
    });
};

module.exports = { uploadToCDN, cloudinary };
