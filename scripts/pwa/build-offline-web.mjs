import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const distRoot = path.join(repoRoot, 'dist');
const runtimePath = path.join(repoRoot, 'src', 'private-content', 'runtime.ts');
const originalRuntimeSource = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf8') : null;

const pwaName = 'Technical English App';
const themeColor = '#0E223D';
const backgroundColor = '#F4E1C1';

function run(command) {
  execSync(command, {
    cwd: repoRoot,
    env: process.env,
    shell: true,
    stdio: 'inherit',
  });
}

function normalizeUrl(filePath) {
  return `/${filePath.split(path.sep).join('/')}`;
}

function walkFiles(directory, prefix = '') {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(absolute, relative);
    }
    return [relative];
  });
}

function copyPwaIcon() {
  const sourceIcon = path.join(repoRoot, 'assets', 'images', 'icon.png');
  const targetIcon = path.join(distRoot, 'pwa-icon.png');
  fs.copyFileSync(sourceIcon, targetIcon);
}

function writeManifest() {
  const manifest = {
    name: pwaName,
    short_name: 'English App',
    description: 'Offline-faehige lokale Lernapp fuer Technical English.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: backgroundColor,
    theme_color: themeColor,
    icons: [
      {
        src: '/pwa-icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  fs.writeFileSync(path.join(distRoot, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function writeOfflinePage() {
  const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${pwaName} offline</title>
    <style>
      body {
        align-items: center;
        background: ${backgroundColor};
        color: #10223f;
        display: flex;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
      }
      main {
        background: #fffaf2;
        border: 2px solid #10223f;
        border-radius: 24px;
        box-shadow: 0 14px 0 rgba(16, 34, 63, 0.14);
        max-width: 520px;
        padding: 28px;
      }
      h1 {
        font-size: 28px;
        margin: 0 0 12px;
      }
      p {
        font-size: 17px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Offline-Modus</h1>
      <p>Die App ist gerade offline. Wenn diese Seite erscheint, wurde die eigentliche App noch nicht vollstaendig zwischengespeichert. Starte den lokalen Update-Server einmal neu und oeffne die App danach erneut.</p>
    </main>
  </body>
</html>
`;
  fs.writeFileSync(path.join(distRoot, 'offline.html'), html, 'utf8');
}

function injectPwaHeadTags() {
  const pwaHead = `    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/pwa-icon.png" />
    <meta name="theme-color" content="${themeColor}" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="${pwaName}" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`;

  for (const relativeFile of walkFiles(distRoot).filter((fileName) => fileName.endsWith('.html'))) {
    const htmlPath = path.join(distRoot, relativeFile);
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (html.includes('rel="manifest"')) {
      continue;
    }
    fs.writeFileSync(htmlPath, html.replace('</head>', `${pwaHead}\n  </head>`), 'utf8');
  }
}

function writeServiceWorker() {
  const urls = walkFiles(distRoot)
    .filter((fileName) => fileName !== 'sw.js')
    .map(normalizeUrl)
    .sort();

  const uniqueUrls = ['/', ...urls].filter((url, index, allUrls) => allUrls.indexOf(url) === index);
  const cacheVersion = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

  const source = `const CACHE_NAME = 'technical-english-app-${cacheVersion}';
const PRECACHE_URLS = ${JSON.stringify(uniqueUrls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/index.html').then((appShell) => appShell || caches.match('/offline.html'));
          }
          return caches.match('/offline.html');
        });
    })
  );
});
`;

  fs.writeFileSync(path.join(distRoot, 'sw.js'), source, 'utf8');
}

try {
  if (!process.argv.includes('--skip-content-build')) {
    run('npm run content:build');
  }

  run('npx expo export --platform web --clear');

  copyPwaIcon();
  writeManifest();
  writeOfflinePage();
  injectPwaHeadTags();
  writeServiceWorker();

  console.log('Offline PWA export created in dist/.');
} finally {
  if (originalRuntimeSource !== null) {
    fs.writeFileSync(runtimePath, originalRuntimeSource, 'utf8');
  }
}
