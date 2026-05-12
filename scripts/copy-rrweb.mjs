import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'rrweb', 'dist', 'rrweb.min.js');
const destDir = join(root, 'public');
const dest = join(destDir, 'rrweb.min.js');

try {
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
} catch (e) {
  console.warn('[copy-rrweb] skipped:', e.message);
}
