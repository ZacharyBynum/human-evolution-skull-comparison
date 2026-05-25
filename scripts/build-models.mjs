import { access, copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const sourceDir = path.resolve('source-assets/raw/original-standard-models');
const outDir = path.resolve('public/models');

await mkdir(outDir, { recursive: true });

try {
  await access(sourceDir);
} catch {
  console.log(`Skipped model optimization; missing optional source directory ${path.relative(process.cwd(), sourceDir)}.`);
  process.exit(0);
}

const models = (await readdir(sourceDir))
  .filter((file) => file.endsWith('.glb'))
  .sort();

for (const model of models) {
  const source = path.join(sourceDir, model);
  const target = path.join(outDir, model);
  const tmp = path.join(outDir, `${path.basename(model, '.glb')}.tmp.glb`);

  await copyFile(source, target);
  await optimize(source, tmp);
  await rm(target, { force: true });
  await copyFile(tmp, target);
  await rm(tmp, { force: true });
}

console.log(`Optimized ${models.length} GLB models into ${path.relative(process.cwd(), outDir)}.`);

function optimize(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      path.resolve('node_modules/.bin/gltf-transform'),
      ['optimize', input, output, '--compress', 'draco'],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `gltf-transform exited with ${code}`));
    });
  });
}
