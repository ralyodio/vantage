#!/usr/bin/env node
/**
 * Downloads CS2 map icons/thumbnails from MurkyYT/cs2-map-icons
 * (Valve depot extracts). Assets are property of Valve Corporation.
 *
 * Usage: node scripts/fetch-map-assets.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'apps', 'web', 'public');
const BASE = 'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images';

const MAPS = [
  'de_mirage',
  'de_inferno',
  'de_dust2',
  'de_nuke',
  'de_overpass',
  'de_ancient',
  'de_anubis',
  'de_vertigo',
  'de_train',
  'cs_office',
  'cs_italy',
  'de_cache',
  'de_cbble',
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log('ok', dest);
}

await mkdir(join(root, 'maps', 'icons'), { recursive: true });
await mkdir(join(root, 'maps', 'thumbs'), { recursive: true });

for (const m of MAPS) {
  await download(`${BASE}/${m}.png`, join(root, 'maps', 'icons', `${m}.png`));
  try {
    await download(`${BASE}/thumbs/${m}_1_png.png`, join(root, 'maps', 'thumbs', `${m}.png`));
  } catch {
    try {
      await download(`${BASE}/thumbs/${m}_png.png`, join(root, 'maps', 'thumbs', `${m}.png`));
    } catch {
      await download(`${BASE}/${m}.png`, join(root, 'maps', 'thumbs', `${m}.png`));
    }
  }
}

console.log('Done. Map assets are Valve IP; local copies for UI only.');
