const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../client/src/assets');
const WIDTH = 2000;
const HEIGHT = 1500; // 4:3 Aspect Ratio for Landscape Certificate

const generateMinimalist = () => {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Off-white Background
    ctx.fillStyle = '#f8fafc'; // Slate 50
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Simple Double Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cbd5e1'; // Slate 300
    ctx.strokeRect(50, 50, WIDTH - 100, HEIGHT - 100);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#94a3b8'; // Slate 400
    ctx.strokeRect(60, 60, WIDTH - 120, HEIGHT - 120);

    // Minimal corner accents
    ctx.fillStyle = '#0f172a'; // Slate 900
    const size = 6;
    ctx.fillRect(50 - size / 2, 50 - size / 2, size, size);
    ctx.fillRect(WIDTH - 50 - size / 2, 50 - size / 2, size, size);
    ctx.fillRect(50 - size / 2, HEIGHT - 50 - size / 2, size, size);
    ctx.fillRect(WIDTH - 50 - size / 2, HEIGHT - 50 - size / 2, size, size);

    return canvas.toBuffer('image/png');
};

const generateArtistic = () => {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Cream/Paper Background
    ctx.fillStyle = '#fffbeb'; // Amber 50
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Artistic "Watercolors" (Random large circles with low opacity)
    const colors = ['rgba(251, 113, 133, 0.1)', 'rgba(244, 114, 182, 0.1)', 'rgba(192, 132, 252, 0.1)', 'rgba(129, 140, 248, 0.1)'];

    for (let i = 0; i < 15; i++) {
        const x = Math.random() * WIDTH;
        const y = Math.random() * HEIGHT;
        const radius = Math.random() * 400 + 100;
        const color = colors[Math.floor(Math.random() * colors.length)];

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    // Hand-drawn style border (Simulated with multiple lines)
    ctx.strokeStyle = '#d97706'; // Amber 600
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Top
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.bezierCurveTo(WIDTH / 3, 35, WIDTH * 2 / 3, 45, WIDTH - 40, 40);
    ctx.stroke();

    // Bottom
    ctx.beginPath();
    ctx.moveTo(40, HEIGHT - 40);
    ctx.bezierCurveTo(WIDTH / 3, HEIGHT - 45, WIDTH * 2 / 3, HEIGHT - 35, WIDTH - 40, HEIGHT - 40);
    ctx.stroke();

    // Left
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.bezierCurveTo(35, HEIGHT / 3, 45, HEIGHT * 2 / 3, 40, HEIGHT - 40);
    ctx.stroke();

    // Right
    ctx.beginPath();
    ctx.moveTo(WIDTH - 40, 40);
    ctx.bezierCurveTo(WIDTH - 45, HEIGHT / 3, WIDTH - 35, HEIGHT * 2 / 3, WIDTH - 40, HEIGHT - 40);
    ctx.stroke();

    return canvas.toBuffer('image/png');
};

const main = () => {
    try {
        if (!fs.existsSync(OUTPUT_DIR)) {
            console.error(`Output directory does not exist: ${OUTPUT_DIR}`);
            process.exit(1);
        }

        const minimalistBuffer = generateMinimalist();
        const minimalistPath = path.join(OUTPUT_DIR, 'minimalist-clean.png');
        fs.writeFileSync(minimalistPath, minimalistBuffer);
        console.log(`Generated: ${minimalistPath}`);

        const artisticBuffer = generateArtistic();
        const artisticPath = path.join(OUTPUT_DIR, 'artistic-watercolor.png');
        fs.writeFileSync(artisticPath, artisticBuffer);
        console.log(`Generated: ${artisticPath}`);

    } catch (err) {
        console.error('Error generating assets:', err);
    }
};

main();
