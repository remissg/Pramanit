const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function testLogoDraw() {
    const logoImg = await loadImage('scratch/downloaded_logo.png');
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');

    // Fill background with dark purple #1e1b4b (Pramanit theme)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, 400, 400);

    // Draw logo in the center
    ctx.drawImage(logoImg, 100, 100, 200, 220);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('scratch/logo_on_dark_bg.png', buffer);
    console.log('Saved test image to scratch/logo_on_dark_bg.png');
}

testLogoDraw();
