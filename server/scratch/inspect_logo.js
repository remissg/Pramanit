const { createCanvas, loadImage } = require('canvas');

async function inspectPixels() {
    const img = await loadImage('scratch/downloaded_logo.png');
    console.log('Image dims:', img.width, 'x', img.height);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    let transparentPixels = 0;
    let totalPixels = data.length / 4;

    for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) {
            transparentPixels++;
        }
    }

    console.log('Total pixels:', totalPixels);
    console.log('Transparent pixels (alpha === 0):', transparentPixels);
    console.log('Corner pixel (0,0) RGBA:', data[0], data[1], data[2], data[3]);
    console.log('Middle pixel RGBA:', data[Math.floor(data.length / 2)], data[Math.floor(data.length / 2) + 1], data[Math.floor(data.length / 2) + 2], data[Math.floor(data.length / 2) + 3]);
}

inspectPixels();
