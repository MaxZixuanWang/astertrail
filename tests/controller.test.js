'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Controller = require('../modules/controller');
const catalog = require('../data/catalog');
const date = new Date('2026-10-15T12:00:00Z');
const fixture = { stars: [], messier: [{ id: 'M31', name: '仙女座大星系', ra: 10.68, dec: 41.27, mag: 3.4, aliases: [] }], constellations: [] };

function centered(confirmed = true, altitude = 30) {
  const model = new Controller(fixture);
  if (confirmed) model.setObserver(31.2, 121.5, '测试位置');
  model.select('M31');
  model.horizontal = () => ({ az: 0, alt: altitude });
  model.camera = { az: 0, alt: altitude, roll: 0 };
  model.count = 0;
  model.onCelebrate = () => model.count++;
  return model;
}

test('requires a continuous 650ms dwell inside one degree, then celebrates once', () => {
  const m = centered();
  m.sample(date, 0);
  assert.equal(m.sample(date, 649).found, false);
  assert.equal(m.count, 0);
  assert.equal(m.sample(date, 650).found, true);
  assert.equal(m.count, 1);
  m.sample(date, 5000);
  assert.equal(m.count, 1);
  assert.equal(m.celebrateUntil, 2450);
});

test('leaving one degree before the dwell completes restarts the full dwell', () => {
  const m = centered();
  m.sample(date, 0);
  m.camera.alt = 28.9;
  m.sample(date, 600);
  m.camera.alt = 30;
  m.sample(date, 700);
  m.sample(date, 1349);
  assert.equal(m.count, 0);
  m.sample(date, 1350);
  assert.equal(m.count, 1);
});

test('one-to-two degree jitter does not rearm; leaving two degrees does', () => {
  const m = centered();
  m.sample(date, 0); m.sample(date, 650);
  m.camera.alt = 28.5;
  m.sample(date, 1000);
  m.camera.alt = 30;
  m.sample(date, 2000); m.sample(date, 2700);
  assert.equal(m.count, 1);
  m.camera.alt = 27.9;
  assert.equal(m.sample(date, 3000).found, false);
  m.camera.alt = 30;
  m.sample(date, 3100); m.sample(date, 3750);
  assert.equal(m.count, 2);
});

test('a centered below-horizon object never celebrates', () => {
  const m = centered(true, -10);
  assert.equal(m.sample(date, 0).below, true);
  assert.equal(m.sample(date, 5000).found, false);
  assert.equal(m.count, 0);
});

test('an unconfirmed example location never celebrates', () => {
  const m = centered(false);
  m.sample(date, 0); m.sample(date, 5000);
  assert.equal(m.count, 0);
  m.setObserver(31, 121);
  m.sample(date, 6000); m.sample(date, 6650);
  assert.equal(m.count, 1);
});

test('changing observer clears the old success cue and allows a new dwell', () => {
  const m = centered();
  m.sample(date, 0); m.sample(date, 650);
  m.setObserver(32, 122);
  assert.equal(m.celebrated, false);
  assert.equal(m.celebrateUntil, 0);
  m.sample(date, 700); m.sample(date, 1350);
  assert.equal(m.count, 2);
});

test('reselecting or clearing a target resets success and invalid IDs clear selection', () => {
  const m = centered();
  m.sample(date, 0); m.sample(date, 650);
  assert.equal(m.select('m 031').id, 'M31');
  assert.equal(m.celebrated, false);
  assert.equal(m.celebrateUntil, 0);
  assert.equal(m.select('M999'), null);
  assert.equal(m.sample(date, 999), null);
});

test('invalid latitude and longitude never replace the current observer', () => {
  const m = centered();
  const observer = m.observer;
  for (const coordinates of [[NaN, 0], [0, Infinity], [91, 0], [0, -181], ['31', 121]]) {
    assert.equal(m.setObserver(...coordinates), false);
    assert.strictEqual(m.observer, observer);
  }
});

test('calibration requires active tracking and confirmed position', () => {
  const m = centered();
  m.setTracking(true);
  m.updatePose({ az: 15, alt: 10, roll: 0 });
  m.setTracking(false);
  assert.equal(m.calibrate(date), false, 'stale sensor pose must not report a successful calibration');
  m.setTracking(true);
  assert.equal(m.calibrate(date), true);
  assert.ok(Math.abs(m.camera.az) < 1e-8);
  assert.ok(Math.abs(m.camera.alt - 30) < 1e-8);
  const unknown = centered(false);
  unknown.setTracking(true);
  unknown.updatePose({ az: 15, alt: 10, roll: 0 });
  assert.equal(unknown.calibrate(date), false, 'example position cannot calibrate the real sky');
});

test('actual catalog IDs and search results select all 110 Messier objects', () => {
  const m = new Controller(catalog);
  for (let i = 1; i <= 110; i++) {
    const result = m.index.search('M' + i)[0];
    assert.equal(result.id, 'M' + i);
    assert.equal(m.select(result.id).kind, 'messier');
    assert.ok(Number.isFinite(m.target.ra) && Number.isFinite(m.target.dec));
  }
  const sirius = m.index.search('天狼星')[0];
  assert.equal(sirius.id, 'HIP32349');
  assert.equal(m.select(sirius.id).kind, 'star');
  assert.equal(new Set(catalog.stars.map(s => s.id)).size, catalog.stars.length);
});
