const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../client/src/assets');
const WIDTH = 2000;
const HEIGHT = 1500; // 4:3 Aspect Ratio for Landscape Certificate

const generateGradient = () => {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Background Gradient (Sleek Blue-Purple)
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#1e293b'); // Dark Slate
    gradient.addColorStop(0.5, '#334155'); // Slate 700
    gradient.addColorStop(1, '#0f172a'); // Slate 900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Accent Gradient Overlay
    const accentGrad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, WIDTH);
    accentGrad.addColorStop(0, 'rgba(99, 102, 241, 0.1)'); // Sheer Indigo
    accentGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Modern Border
    ctx.lineWidth = 20;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80);

    // Corner Accents
    ctx.fillStyle = '#818cf8'; // Indigo 400
    const cornerSize = 15;
    ctx.fillRect(40, 40, cornerSize, cornerSize); // Top-Left
    ctx.fillRect(WIDTH - 40 - cornerSize, 40, cornerSize, cornerSize); // Top-Right
    ctx.fillRect(40, HEIGHT - 40 - cornerSize, cornerSize, cornerSize); // Bottom-Left
    ctx.fillRect(WIDTH - 40 - cornerSize, HEIGHT - 40 - cornerSize, cornerSize, cornerSize); // Bottom-Right

    return canvas.toBuffer('image/png');
};

const generatePattern = () => {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle Grid Pattern
    ctx.strokeStyle = '#e2e8f0'; // Slate 200
    ctx.lineWidth = 2;
    const step = 50;

    for (let x = 0; x <= WIDTH; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    // Geometric Shapes (Tech Vibe)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.05)'; // Very faint indigo
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * WIDTH;
        const y = Math.random() * HEIGHT;
        const size = Math.random() * 200 + 50;
        ctx.fillRect(x, y, size, size);
    }

    // Clean Border
    ctx.strokeStyle = '#94a3b8'; // Slate 400
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, WIDTH - 60, HEIGHT - 60);

    return canvas.toBuffer('image/png');
};

const main = () => {
    try {
        if (!fs.existsSync(OUTPUT_DIR)) {
            console.error(`Output directory does not exist: ${OUTPUT_DIR}`);
            process.exit(1);
        }

        const gradientBuffer = generateGradient();
        const gradientPath = path.join(OUTPUT_DIR, 'gradient-modern.png');
        fs.writeFileSync(gradientPath, gradientBuffer);
        console.log(`Generated: ${gradientPath}`);

        const patternBuffer = generatePattern();
        const patternPath = path.join(OUTPUT_DIR, 'pattern-tech.png');
        fs.writeFileSync(patternPath, patternBuffer);
        console.log(`Generated: ${patternPath}`);

    } catch (err) {
        console.error('Error generating assets:', err);
    }
};

main();
