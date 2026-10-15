(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BrowserMedia = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function createCamera(video, options = {}) {
    const nav = options.navigator || navigator;
    let generation = 0, stream = null;
    const dispose = value => value && value.getTracks().forEach(track => track.stop());
    function stop() {
      generation++;
      dispose(stream); stream = null;
      video.pause(); video.srcObject = null;
    }
    async function start() {
      stop();
      const token = generation;
      if (!nav.mediaDevices || !nav.mediaDevices.getUserMedia) throw new Error('unavailable');
      const acquired = await nav.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (token !== generation) { dispose(acquired); return false; }
      stream = acquired; video.srcObject = acquired;
      acquired.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (token !== generation) return;
        stop(); if (options.onEnded) options.onEnded();
      }));
      try { await video.play(); }
      catch (error) { if (token === generation) stop(); throw error; }
      if (token !== generation) return false;
      return true;
    }
    return { start, stop, get active() { return !!stream; } };
  }
  function createSound(url) {
    let context, buffer, loading, current;
    function unlock() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return Promise.resolve(false);
      if (!context) context = new AudioContext();
      // resume must be called in the input gesture, before any network await.
      const resumed = context.resume();
      if (!loading) loading = fetch(url).then(r => { if (!r.ok) throw new Error('sound'); return r.arrayBuffer(); })
        .then(bytes => context.decodeAudioData(bytes)).then(value => { buffer = value; return true; }).catch(() => { loading = null; return false; });
      return Promise.all([resumed.catch(() => {}), loading]).then(() => !!buffer);
    }
    function stop() { if (current) { try { current.stop(); } catch (_) {} current = null; } }
    function play() {
      if (!context || context.state !== 'running' || !buffer) return false;
      stop(); current = context.createBufferSource(); current.buffer = buffer; current.connect(context.destination); current.start(); return true;
    }
    return { unlock, play, stop };
  }
  return { createCamera, createSound };
});
