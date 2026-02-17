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
            resource_type: 'auto',
            unique_filename: true
        };

        if (Buffer.isBuffer(file)) {
            cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(file);
        } else {
            cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        }
    });
};

module.exports = { uploadToCDN, cloudinary };
