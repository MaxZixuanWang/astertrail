const test = require('node:test');
const assert = require('node:assert/strict');
const BrowserMedia = require('../modules/browser-media');

function deferred() {
  let resolve, reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
function mediaStream() {
  const listeners = [];
  const track = {
    stops: 0,
    stop() { this.stops += 1; },
    addEventListener(type, callback) { if (type === 'ended') listeners.push(callback); },
    end() { listeners.forEach(callback => callback()); }
  };
  return { track, getTracks() { return [track]; }, getVideoTracks() { return [track]; } };
}
function harness() {
  const requests = [];
  const plays = [];
  const playResults = [];
  let ended = 0;
  const video = {
    srcObject: null,
    pauses: 0,
    pause() { this.pauses += 1; },
    play() { plays.push(this.srcObject); return playResults.length ? playResults.shift() : Promise.resolve(); }
  };
  const camera = BrowserMedia.createCamera(video, {
    navigator: { mediaDevices: { getUserMedia(constraints) {
      const request = deferred(); requests.push({ ...request, constraints }); return request.promise;
    } } },
    onEnded() { ended += 1; }
  });
  return { camera, video, requests, plays, playResults, get ended() { return ended; } };
}

test('camera requests rear video without microphone and becomes active after attachment', async () => {
  const h = harness();
  const stream = mediaStream();
  const started = h.camera.start();
  assert.equal(h.requests[0].constraints.audio, false);
  assert.equal(h.requests[0].constraints.video.facingMode.ideal, 'environment');
  assert.equal(h.camera.active, false);
  h.requests[0].resolve(stream);
  assert.equal(await started, true);
  assert.equal(h.video.srcObject, stream);
  assert.deepEqual(h.plays, [stream]);
  assert.equal(h.camera.active, true);
  h.camera.stop();
  assert.equal(h.video.srcObject, null);
  assert.equal(h.camera.active, false);
  assert.equal(stream.track.stops, 1);
  h.camera.stop();
  assert.equal(stream.track.stops, 1);
});

test('denied permission and missing media API leave no camera attached', async () => {
  const h = harness();
  const started = h.camera.start();
  const denial = new Error('NotAllowedError');
  h.requests[0].reject(denial);
  await assert.rejects(started, error => error === denial);
  assert.equal(h.camera.active, false);
  assert.equal(h.video.srcObject, null);
  assert.equal(h.plays.length, 0);
  const unsupported = BrowserMedia.createCamera(h.video, { navigator: {} });
  await assert.rejects(unsupported.start(), /unavailable/);
  assert.equal(unsupported.active, false);
});

test('permission arriving after stop immediately releases every acquired track', async () => {
  const h = harness();
  const stream = mediaStream();
  const extra = { stops: 0, stop() { this.stops += 1; } };
  stream.getTracks = () => [stream.track, extra];
  const started = h.camera.start();
  h.camera.stop();
  h.requests[0].resolve(stream);
  assert.equal(await started, false);
  assert.equal(stream.track.stops, 1);
  assert.equal(extra.stops, 1);
  assert.equal(h.video.srcObject, null);
  assert.equal(h.camera.active, false);
  assert.equal(h.plays.length, 0);
});

test('a superseded permission grant cannot replace or stop a newer camera session', async () => {
  const h = harness();
  const staleStream = mediaStream();
  const currentStream = mediaStream();
  const first = h.camera.start();
  const second = h.camera.start();
  h.requests[1].resolve(currentStream);
  assert.equal(await second, true);
  h.requests[0].resolve(staleStream);
  assert.equal(await first, false);
  assert.equal(staleStream.track.stops, 1);
  assert.equal(currentStream.track.stops, 0);
  assert.equal(h.video.srcObject, currentStream);
  assert.equal(h.camera.active, true);
});

test('stop while playback is pending clears video and prevents a late success', async () => {
  const h = harness();
  const stream = mediaStream();
  const playback = deferred();
  h.playResults.push(playback.promise);
  const started = h.camera.start();
  h.requests[0].resolve(stream);
  await Promise.resolve();
  assert.equal(h.video.srcObject, stream);
  h.camera.stop();
  playback.resolve();
  assert.equal(await started, false);
  assert.equal(stream.track.stops, 1);
  assert.equal(h.video.srcObject, null);
  assert.equal(h.camera.active, false);
});

test('playback failure releases the current stream and propagates its actionable error', async () => {
  const h = harness();
  const stream = mediaStream();
  const failure = new Error('Playback blocked');
  h.playResults.push(Promise.reject(failure));
  const started = h.camera.start();
  h.requests[0].resolve(stream);
  await assert.rejects(started, error => error === failure);
  assert.equal(stream.track.stops, 1);
  assert.equal(h.video.srcObject, null);
  assert.equal(h.camera.active, false);
});

test('an ended camera releases the stream and notifies once', async () => {
  const h = harness();
  const stream = mediaStream();
  const started = h.camera.start();
  h.requests[0].resolve(stream);
  await started;
  stream.track.end();
  assert.equal(h.ended, 1);
  assert.equal(stream.track.stops, 1);
  assert.equal(h.video.srcObject, null);
  assert.equal(h.camera.active, false);
  stream.track.end();
  assert.equal(h.ended, 1);
});

test('an ended event from a superseded track cannot clear the current video', async () => {
  const h = harness();
  const oldStream = mediaStream();
  const currentStream = mediaStream();
  const first = h.camera.start();
  h.requests[0].resolve(oldStream);
  await first;
  const second = h.camera.start();
  h.requests[1].resolve(currentStream);
  await second;
  oldStream.track.end();
  assert.equal(h.ended, 0);
  assert.equal(h.video.srcObject, currentStream);
  assert.equal(currentStream.track.stops, 0);
  assert.equal(h.camera.active, true);
});
