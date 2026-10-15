'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Astro = require('../modules/astro');
const Controller = require('../modules/controller');
const Renderer = require('../modules/renderer');
const catalog = require('../data/catalog');

function canvasMock() {
  return {
    calls: [], currentPath: [], globalAlpha: 1,
    createLinearGradient() { return { addColorStop() {} }; },
    beginPath() { this.currentPath = []; },
    moveTo(x, y) { this.currentPath.push(['move', x, y]); },
    lineTo(x, y) { this.currentPath.push(['line', x, y]); },
    arc(...args) { this.currentPath.push(['arc', ...args]); },
    ellipse(...args) { this.currentPath.push(['ellipse', ...args]); },
    closePath() { this.currentPath.push(['close']); },
    stroke() { this.calls.push({ operation: 'stroke', color: this.strokeStyle, path: this.currentPath.slice() }); },
    fill() { this.calls.push({ operation: 'fill', color: this.fillStyle, path: this.currentPath.slice() }); },
    clearRect(...args) { this.calls.push({ operation: 'clear', args }); },
    fillRect(...args) { this.calls.push({ operation: 'rect', args, color: this.fillStyle }); },
    drawImage(...args) { this.calls.push({ operation: 'image', args }); },
    fillText(text, x, y) { this.calls.push({ operation: 'text', text, x, y, color: this.fillStyle }); },
    measureText(text) { return { width: text.length * 8 }; },
    save() {}, restore() {}
  };
}
const model = { camera: { az: 0, alt: 0, roll: 0 }, width: 400, height: 800, fov: 60 };
function guide(az, alt = 0, camera = model.camera) {
  const ctx = canvasMock();
  const renderer = new Renderer(ctx, { stars: [], messier: [], constellations: [] });
  const result = Astro.project(Astro.horizontalToVector(az, alt), camera, model.width, model.height, model.fov);
  renderer.drawGuide(result, model);
  return { ctx, result, shaft: ctx.calls.find(c => c.operation === 'stroke' && c.path[0][0] === 'move') };
}

test('inside-FOV arrows and target markers are green, outside-FOV arrows red', () => {
  const inside = guide(10);
  assert.equal(inside.result.visible, true);
  assert.equal(inside.shaft.color, Renderer.palette.green);
  assert.ok(inside.ctx.calls.some(c => c.operation === 'stroke' && c.path[0][0] === 'arc' && c.color === Renderer.palette.green));
  const outside = guide(40);
  assert.equal(outside.result.visible, false);
  assert.equal(outside.shaft.color, Renderer.palette.red);
  assert.equal(outside.ctx.calls.some(c => c.operation === 'stroke' && c.path[0][0] === 'arc'), false);
});

test('an in-view arrow ends at its actual projected target and lies on a center ray', () => {
  const { shaft, result } = guide(10, 10);
  const start = shaft.path[0], end = shaft.path[1];
  assert.ok(Math.abs(end[1] - result.x) < 1e-8);
  assert.ok(Math.abs(end[2] - result.y) < 1e-8);
  const dx = end[1] - 200, dy = end[2] - 400;
  assert.ok(Math.abs((start[1] - 200) * dy - (start[2] - 400) * dx) < 1e-7);
  assert.ok(Math.hypot(start[1] - 200, start[2] - 400) <= 24.0001);
});

test('behind-camera arrows preserve shortest east/west directions and red color', () => {
  const east = guide(135), west = guide(225);
  assert.equal(east.result.behind, true);
  assert.equal(west.result.behind, true);
  assert.equal(east.shaft.color, Renderer.palette.red);
  assert.equal(west.shaft.color, Renderer.palette.red);
  assert.ok(east.shaft.path[1][1] > 200);
  assert.ok(west.shaft.path[1][1] < 200);
  assert.equal(east.ctx.calls.find(c => c.operation === 'text').text, '转向背后 135.0°');
});

test('antipode has a deterministic upward edge arrow with a 180 degree label', () => {
  const { shaft, ctx } = guide(180);
  assert.equal(shaft.path[1][1], 200);
  assert.ok(shaft.path[1][2] < 400);
  assert.equal(ctx.calls.find(c => c.operation === 'text').text, '转向背后 180.0°');
});

test('edge arrow remains within the screen inset after phone roll', () => {
  const { shaft } = guide(100, 30, { az: 0, alt: 0, roll: 55 });
  const end = shaft.path[1];
  assert.ok(end[1] >= 29.999 && end[1] <= 370.001);
  assert.ok(end[2] >= 29.999 && end[2] <= 770.001);
});

test('an exactly centered target produces a finite marker and zero-degree label', () => {
  const { ctx, shaft } = guide(0);
  assert.equal(shaft, undefined);
  assert.equal(ctx.calls.find(c => c.operation === 'text').text, '0.0°');
  const marker = ctx.calls.find(c => c.operation === 'stroke');
  assert.deepEqual(marker.path[0].slice(0, 3), ['arc', 200, 400]);
});

test('full real catalog renders finite geometry and samples the controller', () => {
  const ctx = canvasMock();
  const renderer = new Renderer(ctx, catalog);
  const controller = new Controller(catalog);
  const date = new Date('2026-10-15T12:00:00Z');
  controller.setObserver(31.2, 121.5);
  controller.select('M31');
  const target = controller.horizontal(controller.target, date);
  controller.camera = { az: target.az, alt: target.alt, roll: 0 };
  const result = renderer.draw(controller, date, 0);
  assert.ok(result.angle < 1e-8);
  assert.equal(result.visible, true);
  assert.ok(ctx.calls.some(c => c.operation === 'text' && c.text === '0.0°'));
  for (const call of ctx.calls) {
    for (const point of call.path || []) {
      for (const value of point.slice(1)) assert.ok(Number.isFinite(value), JSON.stringify(point));
    }
  }
  for (const constellation of catalog.constellations) {
    for (const pair of constellation.lines) pair.forEach(hip => assert.ok(renderer.hip.has(hip), 'missing HIP ' + hip));
  }
});

test('position cache refreshes immediately when observer changes', () => {
  const renderer = new Renderer(canvasMock(), catalog);
  const controller = new Controller(catalog);
  const date = new Date('2026-10-15T12:00:00Z');
  renderer.updatePositions(controller, date);
  const first = renderer.stars[0].vector;
  controller.setObserver(-33.9, 151.2);
  renderer.updatePositions(controller, date);
  assert.notDeepEqual(renderer.stars[0].vector, first);
});

function cameraScene(video, { width = 393, height = 742, fov = 70, ar = true } = {}) {
  const ctx = canvasMock(), emptyCatalog = { stars: [], messier: [], constellations: [] };
  const controller = new Controller(emptyCatalog);
  Object.assign(controller, { width, height, fov, ar });
  new Renderer(ctx, emptyCatalog).draw(controller, new Date('2026-10-15T12:00:00Z'), 0, video);
  return ctx.calls;
}

test('AR camera source is centered and covers portrait and landscape viewports at every zoom', () => {
  for (const [videoWidth, videoHeight] of [[1280, 720], [720, 1280]]) {
    for (const [width, height] of [[393, 742], [742, 393]]) {
      for (const zoom of [1, 2, 3]) {
        const fov = 360 / Math.PI * Math.atan(Math.tan(35 * Math.PI / 180) / zoom);
        const video = { readyState: 2, videoWidth, videoHeight };
        const images = cameraScene(video, { width, height, fov }).filter(call => call.operation === 'image');
        assert.equal(images.length, 1, 'one camera frame per chart frame');
        const [source, sx, sy, sw, sh, dx, dy, dw, dh] = images[0].args;
        assert.equal(source, video);
        assert.deepEqual([dx, dy, dw, dh], [0, 0, width, height]);
        assert.ok(sx >= -1e-8 && sy >= -1e-8 && sw > 0 && sh > 0);
        assert.ok(sx + sw <= videoWidth + 1e-8 && sy + sh <= videoHeight + 1e-8);
        assert.ok(Math.abs(sx * 2 + sw - videoWidth) < 1e-8);
        assert.ok(Math.abs(sy * 2 + sh - videoHeight) < 1e-8);
        assert.ok(Math.abs(sw / sh - width / height) < 1e-8, 'preserve the camera aspect ratio');
        assert.ok(Math.abs(Math.max(sw / videoWidth, sh / videoHeight) - 1 / zoom) < 1e-8, 'zoom crops the centered cover frame');
      }
    }
  }
});

test('AR paints an opaque background, then camera, shade and star overlays in the same canvas', () => {
  const calls = cameraScene({ readyState: 4, videoWidth: 1280, videoHeight: 720 });
  assert.deepEqual(calls[0], { operation: 'rect', args: [0, 0, 393, 742], color: Renderer.palette.sky });
  assert.equal(calls[1].operation, 'image');
  assert.deepEqual(calls[2], { operation: 'rect', args: [0, 0, 393, 742], color: Renderer.palette.arShade });
  assert.ok(calls.findIndex(call => call.operation === 'stroke') > 2);
  assert.equal(calls.some(call => call.operation === 'clear'), false, 'native video cannot show through the canvas');
});

test('AR waits for usable video frames and never shrinks a camera frame below full cover', () => {
  for (const video of [undefined, { readyState: 1, videoWidth: 1280, videoHeight: 720 },
    { readyState: 2, videoWidth: 0, videoHeight: 720 }, { readyState: 2, videoWidth: 1280, videoHeight: 0 }]) {
    const calls = cameraScene(video);
    assert.equal(calls.some(call => call.operation === 'image'), false);
    assert.deepEqual(calls[0], { operation: 'rect', args: [0, 0, 393, 742], color: Renderer.palette.sky });
  }
  const video = { readyState: 2, videoWidth: 1280, videoHeight: 720 };
  const atOne = cameraScene(video).find(call => call.operation === 'image');
  const wide = cameraScene(video, { fov: 110 }).find(call => call.operation === 'image');
  assert.ok(atOne && wide, 'ready camera frames are drawn');
  assert.deepEqual(wide.args, atOne.args, 'a wide chart FOV cannot leave empty margins around the camera');
});

test('chart mode ignores camera frames and retains its opaque sky background', () => {
  const calls = cameraScene({ readyState: 4, videoWidth: 1280, videoHeight: 720 }, { ar: false });
  assert.equal(calls.some(call => call.operation === 'image'), false);
  assert.equal(calls.some(call => call.operation === 'clear'), false);
  assert.equal(calls[0].operation, 'rect');
  assert.deepEqual(calls[0].args, [0, 0, 393, 742]);
  assert.equal(typeof calls[0].color.addColorStop, 'function');
});

test('one renderer switches cached star, constellation, horizon and guide labels between languages', () => {
  const ctx = canvasMock();
  const renderer = new Renderer(ctx, {
    stars: [{ id: 'HIP32349', name: '天狼', aliases: ['天狼星', 'Sirius'], mag: -1.44, az: 350, alt: 5 }],
    messier: [],
    constellations: [{ id: 'CMa', name: '大犬座', az: 10, alt: 5, lines: [] }]
  });
  const scene = {
    ...model, width: 1000, height: 1000, language: 'zh', lines: true,
    observer: { latitude: 0, longitude: 0 },
    horizontal: object => ({ az: object.az, alt: object.alt }),
    sample: () => Astro.project(Astro.horizontalToVector(135, 0), model.camera, 1000, 1000, model.fov)
  };
  const date = new Date('2026-10-15T12:00:00Z');
  const texts = () => ctx.calls.filter(call => call.operation === 'text').map(call => call.text);
  renderer.draw(scene, date, 0);
  assert.ok(texts().includes('天狼'));
  assert.ok(texts().includes('大犬座'));
  assert.ok(texts().includes('北 · 地平线'));
  assert.ok(texts().includes('转向背后 135.0°'));
  const cachedStars = renderer.stars;

  ctx.calls = [];
  scene.language = 'en';
  renderer.draw(scene, date, 1);
  assert.equal(renderer.stars, cachedStars);
  assert.ok(texts().includes('Sirius'));
  assert.ok(texts().includes('Canis Major'));
  assert.ok(texts().includes('N · Horizon'));
  assert.ok(texts().includes('Turn around 135.0°'));
  assert.equal(texts().some(text => /[\u3400-\u9fff]/.test(text)), false);

  ctx.calls = [];
  scene.language = 'zh';
  renderer.draw(scene, date, 2);
  assert.ok(texts().includes('天狼'));
  assert.ok(texts().includes('大犬座'));
});
