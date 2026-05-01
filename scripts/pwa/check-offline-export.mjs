import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const distRoot = path.join(repoRoot, 'dist');

const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'offline.html',
  'pwa-icon.png',
];

const missingFiles = requiredFiles.filter((fileName) => !fs.existsSync(path.join(distRoot, fileName)));

if (missingFiles.length > 0) {
  throw new Error(`Offline PWA export is incomplete. Missing files:\n${missingFiles.join('\n')}`);
}

const indexHtml = fs.readFileSync(path.join(distRoot, 'index.html'), 'utf8');
for (const expectedSnippet of ['rel="manifest"', 'apple-mobile-web-app-capable', 'theme-color']) {
  if (!indexHtml.includes(expectedSnippet)) {
    throw new Error(`dist/index.html is missing expected PWA head snippet: ${expectedSnippet}`);
  }
}

const serviceWorker = fs.readFileSync(path.join(distRoot, 'sw.js'), 'utf8');
for (const expectedSnippet of ['PRECACHE_URLS', 'CACHE_NAME', 'fetch']) {
  if (!serviceWorker.includes(expectedSnippet)) {
    throw new Error(`dist/sw.js is missing expected service worker snippet: ${expectedSnippet}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(distRoot, 'manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') {
  throw new Error('manifest.webmanifest must use display: standalone');
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  throw new Error('manifest.webmanifest must define at least one icon.');
}

console.log('Offline PWA export check passed.');
