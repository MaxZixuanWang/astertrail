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
  write('app.js', 'window.ready = true; window.build = "__ASTERTRAIL_BUILD__";');
  write('styles/app.css', 'body { background: #08111e; }');
  write('modules/astro.js', 'window.astro = {};');
  write('data/catalog.js', 'window.catalog = [];');
  write('assets/chime.wav', 'test wave');
  write('assets/author.jpg', 'test portrait');
  write('DATA_SOURCES.md', '# Public data attribution');
  write('licenses/DATA-NOTICE.txt', 'Public data license');
  for (const file of ['manifest.webmanifest', 'sw.js', 'update.html', 'icons/icon-192.png', 'icons/icon-512.png']) {
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
  assert.ok(first.files.includes('update.html'));
  assert.equal(first.precache.includes('./update.html'), false);
  assert.match(fs.readFileSync(path.join(first.destination, 'app.js'), 'utf8'), new RegExp(first.version.slice(0, 8)));
  assert.doesNotMatch(fs.readFileSync(path.join(first.destination, 'app.js'), 'utf8'), /__ASTERTRAIL_BUILD__/);
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
    { method: 'GET', mode: 'navigate', url: 'https://sky.example/astertrail/update.html' },
    { method: 'GET', mode: 'navigate', url: 'https://sky.example/astertrail/update.html?retry=1' },
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

function recoveryWorker(state) {
  const listeners = new Set();
  return {
    state, messages: [],
    addEventListener(type, callback) { if (type === 'statechange') listeners.add(callback); },
    removeEventListener(type, callback) { if (type === 'statechange') listeners.delete(callback); },
    change(state) { this.state = state; [...listeners].forEach(callback => callback()); },
    postMessage(message) { this.messages.push(message); },
    get listenerCount() { return listeners.size; }
  };
}

function recoveryPage(registration) {
  const button = { disabled: false }, status = {}, timers = new Map(), navigations = [], registered = [];
  const script = fs.readFileSync(path.join(PROJECT, 'update.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  const serviceWorker = {
    async getRegistration(scope) { assert.equal(scope, 'https://sky.example/astertrail/'); return registration; },
    async register(url, options) { registered.push({ url, options }); return { scope: options.scope }; }
  };
  vm.runInNewContext(script, {
    document: { getElementById(id) { return id === 'update' ? button : status; } },
    navigator: { serviceWorker }, window: { isSecureContext: true }, URL,
    location: { href: 'https://sky.example/astertrail/update.html', replace(url) { navigations.push(url); } },
    setTimeout(callback) { timers.set(1, callback); return 1; }, clearTimeout(id) { timers.delete(id); }
  });
  return { button, status, timers, navigations, registered };
}

async function flushRecovery() { for (let i = 0; i < 8; i++) await Promise.resolve(); }

test('online recovery waits for activation before opening the app and only starts on a click', async () => {
  const worker = recoveryWorker('installed');
  let updates = 0;
  const page = recoveryPage({ scope: 'https://sky.example/astertrail/', waiting: worker, async update() { updates++; } });
  assert.equal(updates, 0);
  const pending = page.button.onclick();
  await flushRecovery();
  assert.equal(updates, 1);
  assert.equal(worker.messages[0].type, 'SKIP_WAITING');
  assert.deepEqual(page.navigations, []);
  assert.equal(page.button.disabled, true);
  worker.change('activating');
  await flushRecovery();
  assert.deepEqual(page.navigations, []);
  worker.change('activated');
  await pending;
  assert.deepEqual(page.navigations, ['https://sky.example/astertrail/']);
  assert.equal(page.button.disabled, false);
  assert.equal(page.timers.size, 0);
  assert.equal(worker.listenerCount, 0);
});

test('online recovery observes an already installing worker without relying on updatefound', async () => {
  const worker = recoveryWorker('installing');
  const older = recoveryWorker('installed');
  const registration = { scope: 'https://sky.example/astertrail/', installing: worker, waiting: older, async update() {} };
  const page = recoveryPage(registration);
  const pending = page.button.onclick();
  await flushRecovery();
  assert.equal(worker.messages.length, 0);
  assert.equal(older.messages.length, 0, 'an older waiting release must not replace the newer installing release');
  registration.waiting = worker;
  worker.change('installed');
  await flushRecovery();
  assert.equal(worker.messages[0].type, 'SKIP_WAITING');
  worker.change('activated');
  await pending;
  assert.equal(page.navigations.length, 1);
});

test('online recovery opens the current version when no update is needed and initializes only its own scope', async () => {
  const current = recoveryPage({ scope: 'https://sky.example/astertrail/', async update() {} });
  await current.button.onclick();
  assert.equal(current.navigations.length, 1);
  const first = recoveryPage(undefined);
  await first.button.onclick();
  assert.equal(first.registered[0].url, 'https://sky.example/astertrail/sw.js');
  assert.equal(first.registered[0].options.scope, 'https://sky.example/astertrail/');
  assert.equal(first.registered[0].options.updateViaCache, 'none');
  assert.equal(first.navigations.length, 1);
  let unrelatedUpdates = 0;
  const other = recoveryPage({ scope: 'https://sky.example/', async update() { unrelatedUpdates++; } });
  await other.button.onclick();
  assert.equal(unrelatedUpdates, 0);
  assert.equal(other.registered.length, 0);
  assert.equal(other.navigations.length, 0);
  assert.match(other.status.textContent, /scope does not match/);
});

test('online recovery supports retry after failure and does not navigate after a timed-out update finishes', async () => {
  let fail = true;
  const page = recoveryPage({ scope: 'https://sky.example/astertrail/', async update() { if (fail) throw new Error('network'); } });
  await page.button.onclick();
  assert.equal(page.button.disabled, false);
  assert.equal(page.navigations.length, 0);
  assert.match(page.status.textContent, /try again/);
  fail = false;
  await page.button.onclick();
  assert.equal(page.navigations.length, 1);

  let finish;
  const worker = recoveryWorker('installed');
  const slow = recoveryPage({ scope: 'https://sky.example/astertrail/', waiting: worker, update() { return new Promise(resolve => { finish = resolve; }); } });
  const pending = slow.button.onclick();
  await flushRecovery();
  slow.timers.get(1)();
  await pending;
  assert.equal(slow.button.disabled, false);
  assert.match(slow.status.textContent, /timed out/);
  finish();
  await flushRecovery();
  assert.equal(worker.messages.length, 0);
  assert.equal(slow.navigations.length, 0);
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
