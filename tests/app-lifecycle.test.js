const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Astro = require('../modules/astro');
const Controller = require('../modules/controller');
const Search = require('../modules/search');
const I18n = require('../modules/i18n');
const Catalog = require('../data/catalog');
const appSource = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const copySource = fs.readFileSync(path.join(__dirname, '../modules/web-copy.js'), 'utf8');

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    dispatch(type, event = {}) { (listeners.get(type) || []).forEach(callback => callback(event)); }
  };
}
function element(id = '') {
  const classes = new Set();
  return Object.assign(eventTarget(), {
    id, hidden: true, disabled: false, open: false, value: '', style: { transform: '' }, dataset: {}, children: [],
    videoWidth: id === 'camera' ? 1280 : 0, videoHeight: id === 'camera' ? 720 : 0,
    classList: {
      add(value) { classes.add(value); }, remove(value) { classes.delete(value); },
      toggle(value, enabled) { if (enabled) classes.add(value); else classes.delete(value); },
      contains(value) { return classes.has(value); }
    },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    showModal() { this.open = true; }, close() { this.open = false; }, blur() {},
    matches(selector) { return selector === 'input' && ['search', 'latitude', 'longitude', 'zoom'].includes(id); },
    setPointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0, right: 375, bottom: 740, width: 375, height: 740 }; },
    getContext() { return { setTransform() {} }; }
  });
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
function harness({ confirmed = true, secure = true } = {}) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  const document = Object.assign(eventTarget(), {
    hidden: false, body: element('body'), documentElement: element('html'), getElementById: get,
    createElement: element, createDocumentFragment: element,
    querySelectorAll(selector) {
      if (selector === 'dialog[open]') return [...elements.values()].filter(el => el.id.endsWith('-dialog') && el.open);
      if (selector === 'dialog') return [...elements.values()].filter(el => el.id.endsWith('-dialog'));
      return [];
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  });
  const window = Object.assign(eventTarget(), { isSecureContext: secure });
  const values = new Map();
  if (confirmed) values.set('xunxing.observer', JSON.stringify({ latitude: 39.9, longitude: 116.4, label: 'Test' }));
  const frames = new Map(), timers = new Map(), draws = [];
  let sequence = 0, trackerCallbacks;
  const sensor = {
    active: false, status: 'stopped', starts: 0, stops: 0,
    start() { this.starts += 1; this.active = true; sensorStatus('waiting'); return Promise.resolve(true); },
    stop() { this.stops += 1; this.active = false; sensorStatus('stopped'); },
    calibrate() { return false; }
  };
  function sensorStatus(status) { sensor.status = status; trackerCallbacks.onStatus(status); }
  function pose(value) { sensorStatus('tracking'); trackerCallbacks.onPose(value); }
  const cameraRequests = [];
  const camera = {
    starts: 0, stops: 0,
    start() { this.starts += 1; const request = deferred(); cameraRequests.push(request); return request.promise; },
    stop() { this.stops += 1; }
  };
  const sound = {
    unlocks: 0, plays: 0, stops: 0,
    unlock() { this.unlocks += 1; return Promise.resolve(true); },
    play() { this.plays += 1; return true; }, stop() { this.stops += 1; }
  };
  const context = vm.createContext({
    window, document, navigator: { onLine: true }, devicePixelRatio: 1,
    localStorage: { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, value); } },
    requestAnimationFrame(callback) { const id = ++sequence; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback) { const id = ++sequence; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    SkyAstro: Astro, SkyController: Controller, SkySearch: Search, SkyI18n: I18n, SkyCatalog: Catalog,
    SkyRenderer: class { draw(model, date, time, video) { draws.push({ width: model.width, height: model.height, fov: model.fov, video }); return model.sample(date, time); } },
    BrowserSensors: { createTracker(astro, callbacks) { trackerCallbacks = callbacks; return sensor; } },
    BrowserMedia: { createSound() { return sound; }, createCamera() { return camera; } }
  });
  vm.runInContext(copySource, context, { filename: 'modules/web-copy.js' });
  vm.runInContext(appSource, context, { filename: 'app.js' });
  return { app: window.Astertrail, document, window, get, sensor, sensorStatus, pose, camera,
    cameraRequests, sound, frames, timers, draws,
    drawFrame() { const [id, callback] = frames.entries().next().value; frames.delete(id); callback((draws.length + 1) * 64); return draws.at(-1); } };
}

test('enabling tracking waits for an actual pose, then follows the first bearing without interpolation', async () => {
  const h = harness();
  h.get('tracking').onclick();
  assert.equal(h.sensor.starts, 1);
  assert.equal(h.app.model.tracking, false);
  h.sensorStatus('tracking');
  assert.equal(h.app.model.tracking, false);
  h.pose({ az: 12, alt: 34, roll: 8 });
  assert.equal(h.app.model.tracking, true);
  assert.equal(h.app.model.camera.az, 12);
  assert.equal(h.app.model.camera.alt, 34);
  assert.equal(h.app.model.camera.roll, 8);
});

test('zoomed chart enters AR with matching video magnification and restores chart view on return', async () => {
  const h = harness();
  h.app.model.fov = 42;
  const starting = h.app.startAR();
  assert.equal(h.sensor.starts, 1);
  assert.equal(h.camera.starts, 1);
  assert.equal(h.app.model.ar, false);
  assert.equal(h.app.model.fov, 42);
  assert.equal(h.get('zoom').disabled, true);
  h.cameraRequests[0].resolve(true);
  await starting;
  assert.equal(h.app.model.ar, true);
  assert.equal(h.app.model.arReady, true);
  assert.equal(h.app.model.fov, 42);
  const frame = h.drawFrame();
  assert.equal(frame.video, h.get('camera'), 'the camera source reaches the same renderer as the star chart');
  assert.equal(frame.fov, 42);
  assert.equal(h.get('zoom').disabled, false);
  assert.equal(h.get('camera').hidden, false);
  h.get('mode-sky').onclick();
  assert.equal(h.camera.stops, 1);
  assert.equal(h.app.model.ar, false);
  assert.equal(h.app.model.arReady, false);
  assert.equal(h.app.model.fov, 42);
  assert.equal(h.get('camera').hidden, true);
  assert.equal(h.drawFrame().video, null, 'returning to the chart no longer samples the camera');
  assert.equal(h.get('camera').style.transform, '');
  assert.equal(h.get('zoom').disabled, false);
});

test('AR clamps a wide chart to the unzoomed camera and restores the wider chart on exit', async () => {
  const h = harness();
  h.get('zoom').value = '0.5'; h.get('zoom').dispatch('input');
  const chartFov = h.app.model.fov;
  const starting = h.app.startAR();
  assert.equal(h.get('camera').hidden, false, 'video is laid out before playback, under the opaque chart');
  h.cameraRequests[0].resolve(true);
  await starting;
  assert.equal(h.app.model.fov, 70);
  assert.equal(h.get('zoom').value, '1');
  assert.equal(h.get('zoom-value').textContent, '1.0×');
  assert.match(h.get('toast').textContent, /1×/);
  assertARFrame(h);
  h.get('zoom').value = '0.5'; h.get('zoom').dispatch('input');
  assert.equal(h.app.model.fov, 70, 'AR never shrinks the video below its native view');
  assertARFrame(h);
  h.app.exitAR();
  assert.equal(h.app.model.fov, chartFov);
  assert.equal(h.get('zoom-value').textContent, '0.5×');
  assert.equal(h.get('camera').style.transform, '');
  assert.equal(h.get('camera').style.width, undefined);
});

function assertARFrame(h) {
  const video = h.get('camera'), frame = h.drawFrame();
  assert.equal(frame.video, video);
  assert.equal(frame.width, h.app.model.width);
  assert.equal(frame.height, h.app.model.height);
  assert.equal(frame.fov, h.app.model.fov);
  assert.equal(video.style.width, undefined, 'native video layout no longer controls the AR crop');
  assert.equal(video.style.transform, '');
}

test('late camera dimensions and portrait stream changes still fill the AR viewport', async () => {
  const h = harness(), video = h.get('camera');
  video.videoWidth = video.videoHeight = 0;
  h.app.model.fov = 110;
  const starting = h.app.startAR();
  h.cameraRequests[0].resolve(true);
  await starting;
  assertARFrame(h);
  video.videoWidth = 720; video.videoHeight = 1280;
  video.dispatch('loadedmetadata');
  assertARFrame(h);
  video.videoWidth = 1280; video.videoHeight = 720;
  video.dispatch('resize');
  assertARFrame(h);
});

test('AR stays centered and fills the screen after rotation and browser viewport resizing', async () => {
  const h = harness();
  const starting = h.app.startAR();
  h.cameraRequests[0].resolve(true);
  await starting;
  h.get('zoom').value = '2'; h.get('zoom').dispatch('input');
  h.get('sky').getBoundingClientRect = () => ({ width: 812, height: 375 });
  h.app.resize();
  assertARFrame(h);
  assert.equal(h.draws.at(-1).width, 812);
  h.get('sky').getBoundingClientRect = () => ({ width: 375, height: 620 });
  h.app.resize();
  assertARFrame(h);
  assert.equal(h.draws.at(-1).height, 620);
});

test('the zoom slider changes chart scale and AR camera scale together without overwriting chart zoom', async () => {
  const h = harness();
  const setZoom = value => { h.get('zoom').value = String(value); h.get('zoom').dispatch('input'); };
  const fovAtScale = scale => 2 * Math.atan(Math.tan(35 * Math.PI / 180) / scale) * 180 / Math.PI;
  setZoom(2);
  assert.ok(Math.abs(h.app.model.fov - fovAtScale(2)) < 1e-8);
  assert.equal(h.get('zoom-value').textContent, '2.0×');
  assert.equal(h.get('camera').style.transform, '');
  const chartFov = h.app.model.fov;
  const starting = h.app.startAR();
  setZoom(3);
  assert.equal(h.app.model.fov, chartFov, 'disabled pending input cannot change the saved chart zoom');
  h.cameraRequests[0].resolve(true);
  await starting;
  setZoom(3);
  assert.ok(Math.abs(h.app.model.fov - fovAtScale(3)) < 1e-8);
  assertARFrame(h);
  assert.ok(Math.abs(h.draws.at(-1).fov - fovAtScale(3)) < 1e-8);
  assert.equal(h.get('zoom-value').textContent, '3.0×');
  h.app.exitAR();
  assert.equal(h.app.model.fov, chartFov);
  assert.equal(h.get('zoom-value').textContent, '2.0×');
  assert.equal(h.get('camera').style.transform, '');
});

test('zoom and pan gestures cannot alter the chart while camera permission is pending', async () => {
  const h = harness();
  h.app.model.fov = 42;
  const heading = { ...h.app.model.camera };
  const starting = h.app.startAR();
  h.get('sky').dispatch('wheel', { deltaY: -300, preventDefault() {} });
  h.window.dispatch('keydown', { target: h.get('sky'), key: '+', preventDefault() {} });
  h.get('sky').dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 200 });
  h.get('sky').dispatch('pointermove', { pointerId: 1, clientX: 200, clientY: 300 });
  assert.equal(h.app.model.fov, 42);
  assert.deepEqual(h.app.model.camera, heading);
  h.cameraRequests[0].resolve(true);
  await starting;
  assert.equal(h.app.model.fov, 42);
});

test('switching modes discards an unfinished chart drag', async () => {
  const h = harness();
  h.get('sky').dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 200 });
  const starting = h.app.startAR();
  h.cameraRequests[0].resolve(true);
  await starting;
  h.app.exitAR();
  const heading = { ...h.app.model.camera };
  h.get('sky').dispatch('pointermove', { pointerId: 1, clientX: 300, clientY: 500 });
  assert.deepEqual(h.app.model.camera, heading);
});

test('denied camera permission preserves chart zoom and leaves no camera magnification', async () => {
  const h = harness();
  h.app.model.fov = 25;
  const starting = h.app.startAR();
  h.cameraRequests[0].reject(new Error('NotAllowedError'));
  await starting;
  assert.equal(h.app.model.ar, false);
  assert.equal(h.app.model.fov, 25);
  assert.equal(h.get('camera').style.transform, '');
  assert.equal(h.get('zoom').disabled, false);
});

test('unconfirmed location opens location entry without requesting sensors or camera', async () => {
  const h = harness({ confirmed: false });
  h.get('location-dialog').close();
  await h.app.startAR();
  assert.equal(h.get('location-dialog').open, true);
  assert.equal(h.camera.starts, 0);
  assert.equal(h.sensor.starts, 0);
  assert.equal(h.app.model.ar, false);
});

test('an insecure page cannot request camera or motion', async () => {
  const h = harness({ secure: false });
  await h.app.startAR();
  assert.equal(h.camera.starts, 0);
  assert.equal(h.sensor.starts, 0);
  assert.equal(h.get('toast').hidden, false);
});

test('cancelled pending AR cannot revive after a late camera grant', async () => {
  const h = harness();
  h.app.model.fov = 49;
  const starting = h.app.startAR();
  h.get('mode-sky').onclick();
  h.cameraRequests[0].resolve(true);
  await starting;
  assert.equal(h.app.model.ar, false);
  assert.equal(h.app.model.arReady, false);
  assert.equal(h.app.model.fov, 49);
  assert.equal(h.get('camera').hidden, true);
  assert.equal(h.get('zoom').disabled, false);
});

test('an old rejected AR request does not disturb a newer successful session', async () => {
  const h = harness();
  const old = h.app.startAR();
  h.app.exitAR();
  const current = h.app.startAR();
  h.cameraRequests[1].resolve(true);
  await current;
  const stops = h.camera.stops;
  h.cameraRequests[0].reject(new Error('Canceled playback'));
  await old;
  assert.equal(h.app.model.ar, true);
  assert.equal(h.camera.stops, stops);
  assert.equal(h.get('camera').hidden, false);
});

for (const event of ['pagehide', 'hidden']) {
  test(`${event} releases camera, tracking, sound and animation; return only resumes drawing`, async () => {
    const h = harness();
    const starting = h.app.startAR();
    h.cameraRequests[0].resolve(true);
    await starting;
    h.pose({ az: 10, alt: 30, roll: 5 });
    assert.equal(h.frames.size, 1);
    if (event === 'hidden') { h.document.hidden = true; h.document.dispatch('visibilitychange'); }
    else h.window.dispatch('pagehide');
    assert.equal(h.app.model.ar, false);
    assert.equal(h.app.model.tracking, false);
    assert.equal(h.app.model.rawCamera, null);
    assert.equal(h.camera.stops, 1);
    assert.equal(h.sensor.stops, 1);
    assert.equal(h.sound.stops, 1);
    assert.equal(h.frames.size, 0);
    assert.equal(h.get('celebration').hidden, true);
    h.document.hidden = false;
    if (event === 'hidden') h.document.dispatch('visibilitychange');
    else h.window.dispatch('pageshow');
    assert.equal(h.frames.size, 1);
    assert.equal(h.app.model.ar, false);
    assert.equal(h.sensor.starts, 1);
  });
}

test('backgrounding while camera permission is pending cancels the eventual grant', async () => {
  const h = harness();
  const starting = h.app.startAR();
  h.window.dispatch('pagehide');
  h.cameraRequests[0].resolve(true);
  await starting;
  assert.equal(h.app.model.ar, false);
  assert.equal(h.app.model.arReady, false);
  assert.equal(h.frames.size, 0);
});

test('backgrounding also cancels a pending search-list animation frame', () => {
  const h = harness();
  h.get('results').dispatch('scroll');
  assert.equal(h.frames.size, 2);
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  assert.equal(h.frames.size, 0);
});

test('AR cannot celebrate with missing sensor data; valid tracking can complete the dwell', async () => {
  const h = harness();
  const starting = h.app.startAR();
  h.cameraRequests[0].resolve(true);
  await starting;
  h.app.model.select('HIP32349');
  h.app.model.horizontal = () => ({ az: 100, alt: 30 });
  h.app.model.camera = { az: 100, alt: 30, roll: 0 };
  h.sensorStatus('unavailable');
  const date = new Date('2026-10-15T12:00:00Z');
  h.app.model.sample(date, 0);
  const unavailable = h.app.model.sample(date, 1000);
  assert.equal(unavailable.found, false);
  assert.equal(h.get('celebration').hidden, true);
  assert.equal(h.sound.plays, 0);
  h.pose({ az: 100, alt: 30, roll: 0 });
  h.app.model.sample(date, 1100);
  const found = h.app.model.sample(date, 1800);
  assert.equal(found.found, true);
  assert.equal(h.get('celebration').hidden, false);
  assert.equal(h.sound.plays, 1);
});
