(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BrowserSensors = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Browser angles use degrees and the W3C Z-X-Y device frame. A relative
  // alpha does not identify north: only an absolute event, a valid compass,
  // or the user's explicit alignment may establish that reference.
  // https://www.w3.org/TR/orientation-event/
  function createTracker(astro, options) {
    options = options || {};
    const win = options.window || window;
    const onPose = options.onPose || function () {};
    const onStatus = options.onStatus || function () {};
    let generation = 0;
    let active = false;
    let status = 'stopped';
    let reference = null;
    let bias = null;
    let last = null;
    let absoluteStream = false;
    let handler = null;
    let timer = null;
    let pending = null;

    function setStatus(value) {
      if (status === value) return;
      status = value;
      onStatus(value);
    }

    function screenAngle() {
      const orientation = win.screen && win.screen.orientation;
      return orientation && Number.isFinite(orientation.angle) ? orientation.angle :
        (Number.isFinite(win.orientation) ? win.orientation : 0);
    }

    function rawPose(sample) {
      return astro.orientationToCamera(sample.alpha, sample.beta, sample.gamma, screenAngle());
    }

    function publish(sample) {
      const pose = rawPose(sample);
      pose.az = astro.normalizeDegrees(pose.az + (bias || 0));
      setStatus('tracking');
      if (active) onPose(pose);
    }

    function receive(event, token) {
      if (!active || token !== generation ||
          ![event.alpha, event.beta, event.gamma].every(Number.isFinite)) return;
      const absolute = event.absolute === true || event.type === 'deviceorientationabsolute';
      // Android can send both streams with different yaw origins.
      if (absoluteStream && !absolute) return;
      if (absolute && !absoluteStream) {
        absoluteStream = true;
        bias = null;
        reference = null;
      }
      last = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
      if (timer !== null) { win.clearTimeout(timer); timer = null; }

      if (reference === 'manual') return publish(last);
      if (absolute) {
        bias = 0;
        reference = 'absolute';
        return publish(last);
      }

      // iOS reports the physical top edge's magnetic heading separately.
      // Establish its yaw offset while that edge has a stable horizontal
      // projection, then retain the offset when the phone is raised.
      const compass = Number.isFinite(event.webkitCompassHeading) && event.webkitCompassHeading >= 0 &&
        (!Number.isFinite(event.webkitCompassAccuracy) || event.webkitCompassAccuracy >= 0);
      if (compass && Math.abs(event.beta) <= 60 && Math.abs(event.gamma) <= 60 && reference !== 'compass') {
        const a = event.alpha * Math.PI / 180;
        const b = event.beta * Math.PI / 180;
        const topAz = Math.atan2(-Math.sin(a) * Math.cos(b), Math.cos(a) * Math.cos(b)) * 180 / Math.PI;
        bias = astro.normalizeDegrees(event.webkitCompassHeading - topAz);
        reference = 'compass';
      }
      if (reference === 'compass') return publish(last);
      setStatus(compass ? 'tilt-needed' : 'calibration-needed');
    }

    // Invoke directly from a tap. The permission call intentionally occurs
    // before any await so Safari retains the user's transient activation.
    function start() {
      if (active) return Promise.resolve(true);
      if (pending) return pending;
      if (win.isSecureContext === false) {
        setStatus('insecure');
        return Promise.resolve(false);
      }
      const Orientation = win.DeviceOrientationEvent;
      if (!Orientation) {
        setStatus('unsupported');
        return Promise.resolve(false);
      }
      const token = ++generation;
      setStatus('requesting');
      let permission;
      try {
        permission = typeof Orientation.requestPermission === 'function' ?
          Orientation.requestPermission(true) : 'granted';
      } catch (error) {
        setStatus('denied');
        return Promise.resolve(false);
      }
      pending = Promise.resolve(permission).then(function (result) {
        if (token !== generation) return false;
        if (result !== 'granted') { setStatus('denied'); return false; }
        active = true;
        handler = function (event) { receive(event, token); };
        win.addEventListener('deviceorientation', handler);
        win.addEventListener('deviceorientationabsolute', handler);
        setStatus('waiting');
        timer = win.setTimeout(function () {
          if (!active || token !== generation) return;
          timer = null;
          if (!last) setStatus('unavailable');
        }, 3000);
        return true;
      }, function () {
        if (token === generation) setStatus('denied');
        return false;
      }).finally(function () { if (token === generation) pending = null; });
      return pending;
    }

    // User points the rear camera toward a known bearing (north = 0).
    function calibrate(azimuth) {
      if (azimuth === undefined) azimuth = 0;
      if (!active || !last || !Number.isFinite(azimuth)) return false;
      const pose = rawPose(last);
      if (Math.abs(pose.alt) > 80) return false; // Yaw is undefined near zenith/nadir.
      bias = astro.normalizeDegrees(azimuth - pose.az);
      reference = 'manual';
      publish(last);
      return true;
    }

    function stop() {
      generation += 1;
      active = false;
      pending = null;
      if (handler) {
        win.removeEventListener('deviceorientation', handler);
        win.removeEventListener('deviceorientationabsolute', handler);
      }
      if (timer !== null) win.clearTimeout(timer);
      handler = null;
      timer = null;
      bias = null;
      last = null;
      reference = null;
      absoluteStream = false;
      setStatus('stopped');
    }

    return {
      start: start,
      stop: stop,
      calibrate: calibrate,
      get status() { return status; },
      get active() { return active; },
      get reference() { return reference; }
    };
  }

  return { createTracker: createTracker };
});
