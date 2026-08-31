const QRCode = require('qrcode');
const { loadImage } = require('canvas');

/**
 * Draws custom Finder Eye (External & Internal)
 */
function drawFinderEye(ctx, x, y, size, externalShape = 'square', internalShape = 'square', darkColor, lightColor) {
    ctx.save();

    const outerSize = size;
    const borderSize = size * (1 / 7);
    const holeSize = size * (5 / 7);
    const innerSize = size * (3 / 7);

    // 1. Draw External Eye Frame
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    if (externalShape === 'circle') {
        ctx.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2, 0, Math.PI * 2);
    } else if (externalShape === 'rounded') {
        if (ctx.roundRect) ctx.roundRect(x, y, outerSize, outerSize, outerSize * 0.3);
        else ctx.rect(x, y, outerSize, outerSize);
    } else if (externalShape === 'leaf') {
        if (ctx.roundRect) ctx.roundRect(x, y, outerSize, outerSize, [outerSize * 0.4, 0, outerSize * 0.4, 0]);
        else ctx.rect(x, y, outerSize, outerSize);
    } else {
        ctx.rect(x, y, outerSize, outerSize);
    }
    ctx.fill();

    // 2. Cutout Hole
    ctx.fillStyle = lightColor === 'transparent' ? '#ffffff' : lightColor;
    const holeX = x + borderSize;
    const holeY = y + borderSize;
    ctx.beginPath();
    if (externalShape === 'circle') {
        ctx.arc(x + outerSize / 2, y + outerSize / 2, holeSize / 2, 0, Math.PI * 2);
    } else if (externalShape === 'rounded' || externalShape === 'leaf') {
        if (ctx.roundRect) ctx.roundRect(holeX, holeY, holeSize, holeSize, holeSize * 0.25);
        else ctx.rect(holeX, holeY, holeSize, holeSize);
    } else {
        ctx.rect(holeX, holeY, holeSize, holeSize);
    }
    ctx.fill();

    // 3. Draw Internal Eye Dot
    ctx.fillStyle = darkColor;
    const dotX = x + borderSize * 2;
    const dotY = y + borderSize * 2;
    ctx.beginPath();
    if (internalShape === 'circle') {
        ctx.arc(x + outerSize / 2, y + outerSize / 2, innerSize / 2, 0, Math.PI * 2);
    } else if (internalShape === 'rounded') {
        if (ctx.roundRect) ctx.roundRect(dotX, dotY, innerSize, innerSize, innerSize * 0.35);
        else ctx.rect(dotX, dotY, innerSize, innerSize);
    } else if (internalShape === 'diamond') {
        const cx = x + outerSize / 2;
        const cy = y + outerSize / 2;
        const r = innerSize / 2;
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
    } else {
        ctx.rect(dotX, dotY, innerSize, innerSize);
    }
    ctx.fill();

    ctx.restore();
}

/**
 * Draws a custom stylized QR Code on a 2D Node-Canvas context.
 */
async function drawCustomQRCode(ctx, qrX, qrY, qrSize, qrConfig, verifyUrl, logoUrl, certId = '') {
    if (!qrConfig || !qrConfig.isVisible) return;

    const darkColor = qrConfig.darkColor || qrConfig.color?.dark || '#000000';
    const lightColor = qrConfig.lightColor || qrConfig.color?.light || '#ffffff';
    const dotStyle = qrConfig.dotStyle || 'square'; // 'square', 'dots', 'rounded', 'diamond'
    const externalEye = qrConfig.externalEye || 'square'; // 'square', 'rounded', 'circle', 'leaf'
    const internalEye = qrConfig.internalEye || 'square'; // 'square', 'rounded', 'circle', 'diamond'
    const frameStyle = qrConfig.frameStyle || 'card'; // 'card', 'transparent', 'bordered'
    const ecLevel = qrConfig.scannability || 'Q'; // Default 'Q' for bold, large, clean modules

    try {
        const qr = QRCode.create(verifyUrl, { errorCorrectionLevel: ecLevel });
        const count = qr.modules.size;
        const cellSize = qrSize / count;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // 1. Draw Frame / Background Card with Crisp Pure White Fill & Border
        const pad = Math.max(6, qrSize * 0.04);
        if (frameStyle === 'card') {
            ctx.fillStyle = lightColor === 'transparent' ? '#ffffff' : lightColor;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(qrX - qrSize / 2 - pad, qrY - qrSize / 2 - pad, qrSize + pad * 2, qrSize + pad * 2, 10);
            } else {
                ctx.rect(qrX - qrSize / 2 - pad, qrY - qrSize / 2 - pad, qrSize + pad * 2, qrSize + pad * 2);
            }
            ctx.fill();
        } else if (frameStyle === 'bordered') {
            ctx.fillStyle = lightColor === 'transparent' ? '#ffffff' : lightColor;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(qrX - qrSize / 2 - pad, qrY - qrSize / 2 - pad, qrSize + pad * 2, qrSize + pad * 2, 10);
            } else {
                ctx.rect(qrX - qrSize / 2 - pad, qrY - qrSize / 2 - pad, qrSize + pad * 2, qrSize + pad * 2);
            }
            ctx.fill();
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = Math.max(1.5, qrSize * 0.015);
            ctx.stroke();
        }

        // Finder Eye bounds check
        const isFinder = (r, c) => {
            if (r < 7 && c < 7) return true; // Top Left
            if (r < 7 && c >= count - 7) return true; // Top Right
            if (r >= count - 7 && c < 7) return true; // Bottom Left
            return false;
        };

        // Center logo cutout bounds check
        const showLogo = (qrConfig.showLogo ?? true) && logoUrl;
        const centerStart = Math.floor(count * 0.40);
        const centerEnd = Math.ceil(count * 0.60);

        const isCenterLogoArea = (r, c) => {
            return showLogo && (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd);
        };

        // 2. Draw Body Modules with High-Contrast Solid Fill
        ctx.fillStyle = darkColor;

        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (isFinder(r, c) || isCenterLogoArea(r, c)) continue;

                const isDark = qr.modules.get(r, c);
                if (!isDark) continue;

                const mx = (qrX - qrSize / 2) + (c * cellSize);
                const my = (qrY - qrSize / 2) + (r * cellSize);

                if (dotStyle === 'dots') {
                    ctx.beginPath();
                    ctx.arc(mx + cellSize / 2, my + cellSize / 2, cellSize * 0.46, 0, Math.PI * 2);
                    ctx.fill();
                } else if (dotStyle === 'rounded') {
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(mx, my, cellSize * 0.96, cellSize * 0.96, cellSize * 0.3);
                    } else {
                        ctx.rect(mx, my, cellSize * 0.96, cellSize * 0.96);
                    }
                    ctx.fill();
                } else if (dotStyle === 'diamond') {
                    ctx.beginPath();
                    const cx = mx + cellSize / 2;
                    const cy = my + cellSize / 2;
                    const h = cellSize * 0.48;
                    ctx.moveTo(cx, cy - h);
                    ctx.lineTo(cx + h, cy);
                    ctx.lineTo(cx, cy + h);
                    ctx.lineTo(cx - h, cy);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillRect(mx - 0.1, my - 0.1, cellSize + 0.35, cellSize + 0.35);
                }
            }
        }

        // 3. Draw 3 Finder Eyes (Top Left, Top Right, Bottom Left)
        const eyeSize = cellSize * 7;
        const originX = qrX - qrSize / 2;
        const originY = qrY - qrSize / 2;

        // Top Left Eye
        drawFinderEye(ctx, originX, originY, eyeSize, externalEye, internalEye, darkColor, lightColor);
        // Top Right Eye
        drawFinderEye(ctx, originX + (count - 7) * cellSize, originY, eyeSize, externalEye, internalEye, darkColor, lightColor);
        // Bottom Left Eye
        drawFinderEye(ctx, originX, originY + (count - 7) * cellSize, eyeSize, externalEye, internalEye, darkColor, lightColor);

        // 4. Draw Center Logo Overlay if enabled
        if (showLogo) {
            try {
                const logoImg = await loadImage(logoUrl);
                const logoSize = qrSize * 0.22;
                const lx = qrX - logoSize / 2;
                const ly = qrY - logoSize / 2;

                // Draw solid background box ONLY if logoBg is explicitly set to true
                if (qrConfig.logoBg) {
                    ctx.fillStyle = lightColor === 'transparent' ? '#ffffff' : lightColor;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(lx - 3, ly - 3, logoSize + 6, logoSize + 6, 6);
                    } else {
                        ctx.rect(lx - 3, ly - 3, logoSize + 6, logoSize + 6);
                    }
                    ctx.fill();
                }

                ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
            } catch (err) {
                console.error('QR Logo Overlay Note:', err.message);
            }
        }

        // 5. Draw Serial ID text below QR
        if (qrConfig.showManualId) {
            const fontSize = Math.max(8, qrSize * 0.11);
            ctx.font = `bold ${fontSize}px "Courier New", monospace`;
            ctx.fillStyle = darkColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const displayId = certId ? `ID: ${certId.slice(0, 18).toUpperCase()}` : 'ID: CERT-SAMPLE-UUID';
            ctx.fillText(displayId, qrX, qrY + qrSize / 2 + 6);
        }

        ctx.restore();
    } catch (qrErr) {
        console.error('drawCustomQRCode Error:', qrErr);
    }
}

module.exports = { drawCustomQRCode, drawFinderEye };
