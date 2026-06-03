import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

const ports = [
  { port: 5173, label: 'Storefront' },
  { port: 5174, label: 'Admin panel' },
];

for (const { port, label } of ports) {
  if (await portInUse(port)) {
    console.error(`\nPort ${port} (${label}) is already in use.`);
    console.error('Stop the old dev server first (Ctrl+C in its terminal), or run:');
    console.error(`  netstat -ano | findstr :${port}`);
    console.error('  taskkill /PID <pid> /F\n');
    process.exit(1);
  }
}

function startVite(args) {
  return spawn(process.execPath, [viteBin, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

const storefront = startVite([]);
const admin = startVite(['--config', 'vite.admin.config.ts']);

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  storefront.kill('SIGTERM');
  admin.kill('SIGTERM');
  setTimeout(() => process.exit(code), 100);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

storefront.on('exit', (code, signal) => {
  if (shuttingDown) return;
  if (signal) shutdown(0);
  else if (code) shutdown(code);
});

admin.on('exit', (code, signal) => {
  if (shuttingDown) return;
  if (signal) shutdown(0);
  else if (code) shutdown(code);
});

console.log('Storefront: http://localhost:5173');
console.log('Admin panel: http://localhost:5174/login');
