/* Raster social cards from our synthetic SVG interface illustrations. Requires sharp. */
const sharp = require('sharp');
const path = require('node:path');
(async () => {
  for (const name of ['overview', 'programs', 'lecturer']) {
    const root = path.join(__dirname, '../images/projects/som-bi-' + name);
    await sharp(root + '.svg').jpeg({quality:92, mozjpeg:true}).toFile(root + '.jpg');
  }
})().catch(error => { console.error(error); process.exitCode=1; });
