import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = path.resolve('source-assets/raw/original-fossil-images');
const thumbsDir = path.resolve('public/images/fossils/thumbs');
const heroPath = path.resolve('public/images/hero-skull.webp');
const validExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

await mkdir(thumbsDir, { recursive: true });

const files = (await readdir(sourceDir))
  .filter((file) => validExt.has(path.extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

for (const file of files) {
  const input = path.join(sourceDir, file);
  const name = path.basename(file, path.extname(file));

  await Promise.all([
    sharp(input)
      .rotate()
      .resize({ width: 160, height: 160, fit: 'cover', position: 'attention' })
      .webp({ quality: 68, effort: 5 })
      .toFile(path.join(thumbsDir, `${name}-160.webp`)),
    sharp(input)
      .rotate()
      .resize({ width: 520, height: 360, fit: 'cover', position: 'attention' })
      .webp({ quality: 76, effort: 5 })
      .toFile(path.join(thumbsDir, `${name}-520.webp`)),
    sharp(input)
      .rotate()
      .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(path.join(thumbsDir, `${name}-1200.webp`))
  ]);
}

await sharp(path.join(sourceDir, '1.jpg'))
  .rotate()
  .resize({ width: 1200, height: 900, fit: 'cover', position: 'attention' })
  .webp({ quality: 78, effort: 5 })
  .toFile(heroPath);

console.log(`Generated ${files.length * 3} derivatives and ${path.relative(process.cwd(), heroPath)}.`);
