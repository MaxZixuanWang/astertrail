'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { build } = require('../tools/build');
const { createServer } = require('../tools/serve');

const PROJECT = path.resolve(__dirname, '..');
const FIXTURE = fs.mkdtempSync(path.join(os.tmpdir(), 'astertrail-pwa-test-'));

function fixture(name) {
  const source = path.join(FIXTURE, name);
  fs.mkdirSync(source, { recursive: true });
  function write(file, value) {
    fs.mkdirSync(path.dirname(path.join(source, file)), { recursive: true });
    fs.writeFileSync(path.join(source, file), value);
  }
  write('index.html', '<!doctype html><link rel="manifest" href="./manifest.webmanifest"><script src="./app.js"></script>');
  write('app.js', 'window.ready = true;');
  write('styles/app.css', 'body { background: #08111e; }');
  write('modules/astro.js', 'window.astro = {};');
  write('data/catalog.js', 'window.catalog = [];');
  write('assets/chime.wav', 'test wave');
  write('assets/author.jpg', 'test portrait');
  write('DATA_SOURCES.md', '# Public data attribution');
  write('licenses/DATA-NOTICE.txt', 'Public data license');
  for (const file of ['manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png']) {
    write(file, fs.readFileSync(path.join(PROJECT, file)));
  }
  return { source, write };
}

function harness(worker, base = 'https://sky.example/') {
  const listeners = new Map();
  const cacheData = new Map();
  let skipped = 0;
  let claimed = 0;
  let networkCalls = 0;
  const cacheStorage = {
    async open(name) {
      if (!cacheData.has(name)) cacheData.set(name, new Map());
      const entries = cacheData.get(name);
      return {
        async addAll(requests) { requests.forEach(request => {
          assert.equal(request.cache, 'reload');
          assert.equal(request.credentials, 'omit');
          assert.equal(request.redirect, 'error');
          entries.set(request.url, new Response('cached ' + request.url));
        }); },
        async match(url) { const entry = entries.get(typeof url === 'string' ? url : url.url); return entry && entry.clone(); }
      };
    },
    async keys() { return [...cacheData.keys()]; },
    async delete(name) { return cacheData.delete(name); }
  };
  const self = {
    location: { href: new URL('sw.js', base).href },
    clients: { claim() { claimed++; return Promise.resolve(); } },
    skipWaiting() { skipped++; return Promise.resolve(); },
    addEventListener(type, callback) { listeners.set(type, callback); }
  };
  vm.runInNewContext(worker, {
    self, caches: cacheStorage, URL, Set, Request,
    fetch: async () => { networkCalls++; throw new Error('offline'); }
  });
  return {
    cacheData,
    get skipped() { return skipped; },
    get claimed() { return claimed; },
    get networkCalls() { return networkCalls; },
    async dispatch(type, values = {}) {
      let waiting;
      let response;
      listeners.get(type)({ ...values,
        waitUntil(promise) { waiting = promise; },
        respondWith(promise) { response = promise; }
      });
      await waiting;
      return response && await response;
    }
  };
}

test('build uses an explicit publish allowlist and a deterministic content version', () => {
  const input = fixture('allowlist');
  input.write('.nojekyll', '');
  input.write('secret.env', 'must not publish');
  input.write('.openai/design.txt', 'must not publish');
  input.write('tests/private.js', 'must not publish');
  const first = build(input.source);
  assert.equal(first.files.includes('secret.env'), false);
  assert.equal(fs.existsSync(path.join(first.destination, '.nojekyll')), true);
  assert.equal(first.precache.includes('./.nojekyll'), false);
  assert.equal(first.files.some(file => file.startsWith('.openai/') || file.startsWith('tests/')), false);
  assert.equal(build(input.source).version, first.version);
  input.write('app.js', 'window.ready = false;');
  assert.notEqual(build(input.source).version, first.version);
  assert.match(fs.readFileSync(path.join(first.destination, 'sw.js'), 'utf8'), /const RELEASE = '[a-f0-9]{16}'/);
});

test('every offline resource exists and the manifest works at root and under a subdirectory', () => {
  const input = fixture('paths');
  const result = build(input.source);
  const manifest = JSON.parse(fs.readFileSync(path.join(result.destination, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, undefined);
  for (const base of ['https://sky.example/', 'https://sky.example/astertrail/']) {
    for (const file of result.precache) {
      const url = new URL(file, base);
      assert.ok(url.href.startsWith(base));
      assert.ok(fs.existsSync(path.join(result.destination, decodeURIComponent(url.pathname.slice(new URL(base).pathname.length)))));
    }
    for (const property of ['id', 'scope', 'start_url']) assert.equal(new URL(manifest[property], base).href, base);
    for (const icon of manifest.icons) assert.ok(result.precache.includes(icon.src));
  }
  assert.ok(result.precache.includes('./data/catalog.js'));
  assert.ok(result.precache.includes('./assets/chime.wav'));
  assert.ok(result.precache.includes('./assets/author.jpg'));
  assert.ok(result.precache.includes('./DATA_SOURCES.md'));
  assert.ok(result.precache.includes('./licenses/DATA-NOTICE.txt'));
});

test('generated icons have the declared dimensions including the iPhone home-screen icon', () => {
  for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    const png = fs.readFileSync(path.join(PROJECT, 'icons', file));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test('the worker opens the cached app and assets offline at either deployment depth', async () => {
  const result = build(fixture('offline').source);
  const worker = fs.readFileSync(path.join(result.destination, 'sw.js'), 'utf8');
  for (const base of ['https://sky.example/', 'https://sky.example/astertrail/']) {
    const runtime = harness(worker, base);
    await runtime.dispatch('install');
    assert.equal(runtime.skipped, 0, 'installing an update must not replace an active session');
    const start = await runtime.dispatch('fetch', { request: { method: 'GET', mode: 'navigate', url: base } });
    assert.equal(await start.text(), 'cached ' + base + 'index.html');
    const withQuery = await runtime.dispatch('fetch', { request: { method: 'GET', mode: 'navigate', url: base + '?launch=home' } });
    assert.equal(await withQuery.text(), 'cached ' + base + 'index.html');
    const starData = await runtime.dispatch('fetch', { request: { method: 'GET', mode: 'cors', url: base + 'data/catalog.js' } });
    assert.equal(await starData.text(), 'cached ' + base + 'data/catalog.js');
    assert.equal(runtime.networkCalls, 0);
  }
});

test('the worker never intercepts remote, unrelated, login or write requests', async () => {
  const result = build(fixture('scope').source);
  const runtime = harness(fs.readFileSync(path.join(result.destination, 'sw.js'), 'utf8'), 'https://sky.example/astertrail/');
  await runtime.dispatch('install');
  for (const request of [
    { method: 'GET', mode: 'navigate', url: 'https://other.example/' },
    { method: 'GET', mode: 'navigate', url: 'https://sky.example/account/login' },
    { method: 'GET', mode: 'navigate', url: 'https://sky.example/astertrail/login' },
    { method: 'GET', mode: 'cors', url: 'https://sky.example/astertrail/api/private' },
    { method: 'POST', mode: 'cors', url: 'https://sky.example/astertrail/app.js' }
  ]) assert.equal(await runtime.dispatch('fetch', { request }), undefined);
  assert.equal(runtime.networkCalls, 0);
});

test('updates require the explicit message and clean only their own deployment caches', async () => {
  const result = build(fixture('update').source);
  const runtime = harness(fs.readFileSync(path.join(result.destination, 'sw.js'), 'utf8'), 'https://sky.example/astertrail/');
  runtime.cacheData.set('astertrail:/astertrail/:old', new Map());
  runtime.cacheData.set('astertrail:/:different-site', new Map());
  runtime.cacheData.set('another-app', new Map());
  await runtime.dispatch('install');
  await runtime.dispatch('message', { data: { type: 'HELLO' } });
  assert.equal(runtime.skipped, 0);
  await runtime.dispatch('message', { data: { type: 'SKIP_WAITING' } });
  assert.equal(runtime.skipped, 1);
  await runtime.dispatch('activate');
  assert.equal(runtime.claimed, 1);
  assert.equal(runtime.cacheData.has('astertrail:/astertrail/:old'), false);
  assert.equal(runtime.cacheData.has('astertrail:/:different-site'), true);
  assert.equal(runtime.cacheData.has('another-app'), true);
});

test('preview server serves root and subfolder builds with correct MIME and no workspace exposure', async () => {
  const result = build(fixture('server').source);
  for (const basePath of ['/', '/astertrail/']) {
    const server = createServer({ root: result.destination, basePath });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    try {
      const response = await fetch(origin + basePath);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      const manifest = await fetch(origin + basePath + 'manifest.webmanifest');
      assert.match(manifest.headers.get('content-type'), /application\/manifest\+json/);
      const js = await fetch(origin + basePath + 'sw.js');
      assert.match(js.headers.get('content-type'), /application\/javascript/);
      assert.equal(js.headers.get('cache-control'), 'no-store');
      const png = await fetch(origin + basePath + 'icons/icon-192.png');
      assert.equal(png.headers.get('content-type'), 'image/png');
      assert.equal((await fetch(origin + basePath + 'package.json')).status, 404);
      assert.equal((await fetch(origin + basePath + 'app.js', { method: 'POST' })).status, 405);
      assert.equal((await fetch(origin + basePath + '%2e%2e%2fpackage.json')).status, 403);
      if (basePath !== '/') assert.equal((await fetch(origin + '/')).status, 404);
    } finally { await new Promise(resolve => server.close(resolve)); }
  }
});
