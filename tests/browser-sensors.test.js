const test = require('node:test');
const assert = require('node:assert/strict');
const Astro = require('../modules/astro');
const BrowserSensors = require('../modules/browser-sensors');

function harness(properties = {}) {
  const listeners = new Map();
  const timers = new Set();
  const poses = [];
  const statuses = [];
  const win = {
    isSecureContext: true,
    DeviceOrientationEvent: function () {},
    screen: { orientation: { angle: 0 } },
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type, handler) { if (listeners.get(type) === handler) listeners.delete(type); },
    setTimeout(callback) { timers.add(callback); return callback; },
    clearTimeout(callback) { timers.delete(callback); },
    ...properties
  };
  const tracker = BrowserSensors.createTracker(Astro, { window: win,
    onPose(pose) { poses.push(pose); }, onStatus(status) { statuses.push(status); } });
  return { tracker, poses, statuses, win, listeners, timers,
    send(event = {}, type = 'deviceorientation') {
      const callback = listeners.get(type);
      if (callback) callback({ type, alpha: 0, beta: 90, gamma: 0, ...event });
    } };
}
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`); }
function angle(actual, expected) { close(((actual - expected + 540) % 360) - 180, 0); }

test('absolute heading follows rear camera north/east and upward tilt in degrees', async () => {
  const h = harness();
  assert.equal(await h.tracker.start(), true);
  h.send({ absolute: true });
  angle(h.poses.at(-1).az, 0);
  close(h.poses.at(-1).alt, 0);
  h.send({ absolute: true, alpha: 270, beta: 120 });
  angle(h.poses.at(-1).az, 90);
  close(h.poses.at(-1).alt, 30);
  assert.equal(h.tracker.reference, 'absolute');
  assert.equal(h.tracker.status, 'tracking');
});

test('screen rotation changes roll without changing physical rear-camera bearing', async () => {
  const h = harness();
  await h.tracker.start();
  h.send({ absolute: true });
  close(h.poses.at(-1).roll, 0);
  h.win.screen.orientation.angle = 90;
  h.send({ absolute: true });
  angle(h.poses.at(-1).az, 0);
  close(h.poses.at(-1).roll, 90);
  h.win.screen = {};
  h.win.orientation = -90;
  h.send({ absolute: true });
  close(h.poses.at(-1).roll, -90);
});

test('relative orientation never invents north; explicit calibration tracks subsequent motion', async () => {
  const h = harness();
  await h.tracker.start();
  h.send({ alpha: 50 });
  assert.equal(h.poses.length, 0);
  assert.equal(h.tracker.status, 'calibration-needed');
  assert.equal(h.tracker.calibrate(0), true);
  angle(h.poses.at(-1).az, 0);
  h.send({ alpha: 320 });
  angle(h.poses.at(-1).az, 90);
  assert.equal(h.tracker.reference, 'manual');
});

test('manual calibration supports known non-north bearings and rejects missing/vertical samples', async () => {
  const h = harness();
  assert.equal(h.tracker.calibrate(), false);
  await h.tracker.start();
  h.send({ beta: 0 });
  assert.equal(h.tracker.calibrate(), false);
  h.send();
  assert.equal(h.tracker.calibrate(NaN), false);
  assert.equal(h.tracker.calibrate(180), true);
  angle(h.poses.at(-1).az, 180);
});

test('iOS compass establishes a yaw offset while flat and keeps it when raised', async () => {
  const h = harness();
  await h.tracker.start();
  h.send({ alpha: 30, webkitCompassHeading: 100, webkitCompassAccuracy: 5 });
  assert.equal(h.tracker.status, 'tilt-needed');
  assert.equal(h.poses.length, 0);
  h.send({ alpha: 30, beta: 40, webkitCompassHeading: 100, webkitCompassAccuracy: 5 });
  angle(h.poses.at(-1).az, 100);
  h.send({ alpha: 300, beta: 120, webkitCompassHeading: 10, webkitCompassAccuracy: 5 });
  angle(h.poses.at(-1).az, 190);
  close(h.poses.at(-1).alt, 30);
  assert.equal(h.tracker.reference, 'compass');
});

test('zero is a valid iOS heading; invalid accuracy and negative heading cannot establish north', async () => {
  const h = harness();
  await h.tracker.start();
  h.send({ beta: 30, webkitCompassHeading: -1 });
  h.send({ beta: 30, webkitCompassHeading: 0, webkitCompassAccuracy: -1 });
  assert.equal(h.poses.length, 0);
  h.send({ beta: 30, webkitCompassHeading: 0, webkitCompassAccuracy: 0 });
  angle(h.poses.at(-1).az, 0);
});

test('Android absolute event takes priority over the separate relative yaw stream', async () => {
  const h = harness();
  await h.tracker.start();
  h.send({ alpha: 50 });
  h.tracker.calibrate(0);
  h.send({ alpha: 270 }, 'deviceorientationabsolute');
  angle(h.poses.at(-1).az, 90);
  const count = h.poses.length;
  h.send({ alpha: 123 });
  assert.equal(h.poses.length, count);
  assert.equal(h.tracker.reference, 'absolute');
});

test('permission request occurs synchronously in start and requests an absolute reference', async () => {
  let calls = 0;
  let absoluteRequested;
  const h = harness({ DeviceOrientationEvent: { requestPermission(absolute) {
    calls += 1; absoluteRequested = absolute; return Promise.resolve('granted');
  } } });
  const pending = h.tracker.start();
  assert.equal(calls, 1);
  assert.equal(absoluteRequested, true);
  assert.equal(h.tracker.start(), pending);
  assert.equal(h.listeners.size, 0);
  await pending;
  assert.equal(h.listeners.size, 2);
  await h.tracker.start();
  assert.equal(calls, 1);
});

test('denial, synchronous error, rejection, unsupported and insecure contexts never start listeners', async () => {
  for (const [properties, status] of [
    [{ DeviceOrientationEvent: { requestPermission() { return 'denied'; } } }, 'denied'],
    [{ DeviceOrientationEvent: { requestPermission() { throw new Error('gesture'); } } }, 'denied'],
    [{ DeviceOrientationEvent: { requestPermission() { return Promise.reject(new Error('permission')); } } }, 'denied'],
    [{ DeviceOrientationEvent: undefined }, 'unsupported'],
    [{ isSecureContext: false }, 'insecure']
  ]) {
    const h = harness(properties);
    assert.equal(await h.tracker.start(), false);
    assert.equal(h.tracker.status, status);
    assert.equal(h.listeners.size, 0);
    assert.equal(h.tracker.active, false);
  }
});

test('stop while permission pending prevents a late grant from installing listeners', async () => {
  let grant;
  const h = harness({ DeviceOrientationEvent: { requestPermission() {
    return new Promise(resolve => { grant = resolve; });
  } } });
  const pending = h.tracker.start();
  h.tracker.stop();
  grant('granted');
  assert.equal(await pending, false);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.tracker.status, 'stopped');
});

test('stop removes listeners/timer and rejects callbacks from the previous session', async () => {
  const h = harness();
  await h.tracker.start();
  const oldHandler = h.listeners.get('deviceorientation');
  const oldTimer = [...h.timers][0];
  h.tracker.stop();
  assert.equal(h.listeners.size, 0);
  assert.equal(h.timers.size, 0);
  oldHandler({ absolute: true, alpha: 0, beta: 90, gamma: 0 });
  oldTimer();
  assert.equal(h.poses.length, 0);
  await h.tracker.start();
  const currentTimer = [...h.timers][0];
  oldTimer();
  oldHandler({ absolute: true, alpha: 0, beta: 90, gamma: 0 });
  assert.equal(h.poses.length, 0);
  h.send({ alpha: 10 });
  assert.equal(h.tracker.status, 'calibration-needed');
  assert.equal(h.timers.has(currentTimer), false);
});

test('a browser exposing the API without hardware gets a timeout; later valid data can recover', async () => {
  const h = harness();
  await h.tracker.start();
  h.send({ alpha: null, beta: null, gamma: null });
  h.send({ alpha: NaN });
  [...h.timers][0]();
  assert.equal(h.tracker.status, 'unavailable');
  assert.equal(h.poses.length, 0);
  h.send({ absolute: true, alpha: 270 });
  assert.equal(h.tracker.status, 'tracking');
  angle(h.poses.at(-1).az, 90);
});
