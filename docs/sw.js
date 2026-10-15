'use strict';

// tools/build.js replaces these values with the exact release contents.
const RELEASE = '390ccac760449c12';
const PRECACHE_PATHS = ["./DATA_SOURCES.en.md","./DATA_SOURCES.md","./app.js","./assets/author.jpg","./assets/chime.wav","./assets/logo.png","./data/catalog.js","./data/labels.js","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon.svg","./index.html","./licenses/CC-BY-SA-4.0.txt","./licenses/DATA-NOTICE.txt","./licenses/OpenNGC-REUSE.txt","./licenses/README.en.md","./licenses/README.md","./licenses/pypinyin-MIT.txt","./manifest.webmanifest","./modules/astro.js","./modules/browser-media.js","./modules/browser-sensors.js","./modules/controller.js","./modules/i18n.js","./modules/renderer.js","./modules/search.js","./modules/sensors.js","./modules/web-copy.js","./styles/base.css","./styles/browser.css","./styles/sky.css","./styles/tokens.css"];
const BASE = new URL('./', self.location.href);
const CACHE_PREFIX = 'astertrail:' + BASE.pathname + ':';
const CACHE_NAME = CACHE_PREFIX + RELEASE;
const SHELL = new URL('./index.html', BASE).href;
const PRECACHE_URLS = PRECACHE_PATHS.map(path => new URL(path, BASE).href);
const PRECACHE_SET = new Set(PRECACHE_URLS);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(PRECACHE_URLS.map(url => new Request(url, {
      cache: 'reload', credentials: 'omit', redirect: 'error'
    })))));
  // An update waits until the user accepts it or all existing tabs close.
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;

  if (PRECACHE_SET.has(url.href)) {
    // Keep the entire running release consistent until its update is accepted.
    event.respondWith(caches.open(CACHE_NAME).then(cache =>
      cache.match(url.href).then(cached => cached || fetch(request))));
    return;
  }

  if (request.mode === 'navigate') {
    // Only the app's own start page gets an offline fallback. No account,
    // unrelated navigation or remote pages are intercepted or cached.
    const isStart = url.pathname === BASE.pathname || url.pathname === new URL(SHELL).pathname;
    if (!isStart) return;
    event.respondWith(caches.open(CACHE_NAME).then(cache =>
      cache.match(SHELL).then(cached => cached || fetch(request))));
  }
});
