/**
 * Vercel build entry — one repo, two projects:
 * - Store project: default (build storefront → dist)
 * - Admin project: set env DWARIKA_APP=admin (build admin → dist)
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const isAdmin = String(process.env.DWARIKA_APP || '').trim().toLowerCase() === 'admin';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (isAdmin) {
  console.log('[vercel-build] Admin project — npm run build:admin');
  run('npm', ['run', 'build:admin']);
  const adminOut = path.join(root, 'dist-admin');
  const dist = path.join(root, 'dist');
  if (!existsSync(path.join(adminOut, 'index.html'))) {
    console.error('[vercel-build] dist-admin/index.html missing after build:admin');
    process.exit(1);
  }
  rmSync(dist, { recursive: true, force: true });
  cpSync(adminOut, dist, { recursive: true });
  console.log('[vercel-build] Copied dist-admin → dist for Vercel output');
} else {
  console.log('[vercel-build] Store project — npm run build');
  run('npm', ['run', 'build']);
}
