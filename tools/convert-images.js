const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const images = ['details1.png','details2.png','details3.png'];
const sizes = [800, 1600];
const formats = ['webp','avif'];

// icons to rasterize from SVG (name only, will live in public/images/icons)
const icons = ['KZ-Monogram.svg'];
const iconSizes = [400]; // target width for rasterized icons
const iconFormat = 'webp';
const iconQuality = 70; // tune down to stay under 100KB

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

  // process icons (SVG -> WebP) to produce a single optimized raster
  const iconsDir = path.join(__dirname, '..', 'public', 'images', 'icons');
  for (const ico of icons) {
    const base = ico.replace(/\.svg$/i, '');
    const srcPath = path.join(iconsDir, ico);
    if (!fs.existsSync(srcPath)) {
      console.warn('icon source not found:', srcPath);
      continue;
    }
    for (const size of iconSizes) {
      const outName = `${base}-${size}.${iconFormat}`;
      const outPath = path.join(iconsDir, outName);
      try {
        await sharp(srcPath)
          .resize({ width: size })
          [iconFormat]({ quality: iconQuality, alphaQuality: 80 })
          .toFile(outPath);
        console.log('wrote', outPath);
      } catch (err) {
        console.error('error converting icon', srcPath, err);
      }
    }
    // also write a plain webp without size suffix (for easy replacement)
    try {
      const outPath2 = path.join(iconsDir, `${base}.${iconFormat}`);
      await sharp(path.join(iconsDir, ico))
        .resize({ width: iconSizes[0] })
        [iconFormat]({ quality: iconQuality, alphaQuality: 80 })
        .toFile(outPath2);
      console.log('wrote', outPath2);
    } catch (err) {
      console.error('error writing icon fallback', err);
    }
  }
})();
