const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeOgCropped() {
  const src = path.join(__dirname, '..', 'public', 'images', 'prev-main-ok.png');
  const out = path.join(__dirname, '..', 'public', 'images', 'prev-main-ok_og.jpg');

  if (!fs.existsSync(src)) {
    console.error('Source image not found:', src);
    process.exit(1);
  }

  const width = 1200;
  const height = 630; // social preview

  try {
    await sharp(src)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85, progressive: true })
      .toFile(out);

    const stats = fs.statSync(out);
    console.log('Created cropped OG image:', out);
    console.log('Size KB:', (stats.size / 1024).toFixed(2));
    const meta = await sharp(out).metadata();
    console.log('Dimensions:', meta.width, 'x', meta.height);
  } catch (err) {
    console.error('Error creating OG cropped image:', err);
    process.exit(2);
  }
}

makeOgCropped();
