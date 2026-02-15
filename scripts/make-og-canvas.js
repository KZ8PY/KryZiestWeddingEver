const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeOgCanvas() {
  const src = path.join(__dirname, '..', 'public', 'images', 'prev-main_optimized.jpg');
  const out = path.join(__dirname, '..', 'public', 'images', 'prev-main_og.jpg');

  if (!fs.existsSync(src)) {
    console.error('Source image not found:', src);
    process.exit(1);
  }

  const width = 1200;
  const height = 630; // Facebook recommended
  const background = { r: 255, g: 255, b: 255, alpha: 1 };

  try {
    await sharp(src)
      .resize({ width: width, height: height, fit: 'contain', background })
      .jpeg({ quality: 90 })
      .toFile(out);

    const stats = fs.statSync(out);
    console.log('Created OG canvas image:', out);
    console.log('Size KB:', (stats.size / 1024).toFixed(2));
    const meta = await sharp(out).metadata();
    console.log('Dimensions:', meta.width, 'x', meta.height);
  } catch (err) {
    console.error('Error creating OG canvas:', err);
    process.exit(2);
  }
}

makeOgCanvas();
