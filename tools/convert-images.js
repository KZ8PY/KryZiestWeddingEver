const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const images = ['details1.png','details2.png','details3.png'];
const sizes = [800, 1600];
const formats = ['webp','avif'];

(async function(){
  const srcDir = path.join(__dirname, '..', 'public', 'images', 'details');
  for (const img of images) {
    const base = img.replace(/\.png$/i, '');
    const srcPath = path.join(srcDir, img);
    if (!fs.existsSync(srcPath)) {
      console.warn('source not found:', srcPath);
      continue;
    }
    for (const size of sizes) {
      for (const fmt of formats) {
        const outName = `${base}-${size}.${fmt}`;
        const outPath = path.join(srcDir, outName);
        try {
          await sharp(srcPath)
            .resize({ width: size })
            [fmt]({ quality: 80 })
            .toFile(outPath);
          console.log('wrote', outPath);
        } catch (err) {
          console.error('error converting', srcPath, err);
        }
      }
    }
  }
})();
