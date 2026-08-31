const axios = require('axios');
const fs = require('fs');

async function checkImage() {
    const url = 'https://res.cloudinary.com/jurhvlnm/image/upload/v1788206144/pramanit/logos/ohvtbcjkw8fugomboerr.png';
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        console.log('Image download status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Buffer length:', response.data.length);
        fs.writeFileSync('scratch/downloaded_logo.png', response.data);
        console.log('Saved to scratch/downloaded_logo.png');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkImage();
