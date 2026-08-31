const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');
const fs = require('fs');

async function testQR() {
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 400);

    const qrConfig = {
        size: 200,
        darkColor: '#4f46e5',
        lightColor: '#ffffff',
        dotStyle: 'dots', // 'square', 'dots', 'rounded'
        frameStyle: 'card',
        showLogo: false
    };

    const qr = QRCode.create('https://example.com/verify/12345', { errorCorrectionLevel: 'H' });
    const count = qr.modules.size;
    const qrSize = 200;
    const qrX = 200;
    const qrY = 200;
    const cellSize = qrSize / count;

    ctx.fillStyle = qrConfig.darkColor;

    for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
            const isDark = qr.modules.get(r, c);
            if (!isDark) continue;

            const mx = (qrX - qrSize / 2) + (c * cellSize);
            const my = (qrY - qrSize / 2) + (r * cellSize);

            if (qrConfig.dotStyle === 'dots') {
                ctx.beginPath();
                ctx.arc(mx + cellSize / 2, my + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(mx, my, cellSize + 0.3, cellSize + 0.3);
            }
        }
    }

    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync('C:/Users/Joydip Maiti/Desktop/Pramanit/server/scratch/test_qr.png', buf);
    console.log('Successfully generated test QR!');
}

testQR().catch(console.error);
