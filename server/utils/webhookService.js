const axios = require('axios');

/**
 * Send a webhook event to the specified URL
 * @param {string} url - The target webhook URL
 * @param {string} event - The event type (e.g., 'certificate.verified')
 * @param {object} payload - The data to send
 */
const sendWebhook = async (url, event, payload) => {
    if (!url) return;

    try {
        const response = await axios.post(url, {
            event,
            timestamp: new Date().toISOString(),
            data: payload
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CertiFlow-Webhook-Generator/1.0'
            },
            timeout: 5000 // 5 second timeout for delivery
        });

        console.log(`Webhook [${event}] delivered to ${url} with status ${response.status}`);
    } catch (error) {
        console.error(`Webhook [${event}] delivery failed to ${url}:`, error.message);
    }
};

module.exports = { sendWebhook };
