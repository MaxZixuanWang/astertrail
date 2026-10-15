(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SkySensors = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createTracker(astro) {
    let heading = null;
    let headingAt = 0;
    let bias = null;
    let biasAt = 0;
    let degrees = false;
    const tracker = {
      status: 'waiting-compass',
      compass,
      motion,
      reset
    };

    function compass(res) {
      if (!res || !Number.isFinite(res.direction)) return;
      if (res.accuracy === 'unreliable' || res.accuracy === 'no-contact') return;
      heading = astro.normalizeDegrees(res.direction);
      headingAt = Date.now();
      if (bias === null) tracker.status = 'waiting-motion';
    }

    function motion(res) {
      if (!res || ![res.alpha, res.beta, res.gamma].every(Number.isFinite)) return null;
      // WeChat documents radians. A value above 2π identifies a degree-reporting device.
      if ([res.alpha, res.beta, res.gamma].some(value => Math.abs(value) > 2 * Math.PI + 0.01)) degrees = true;
      const scale = degrees ? 1 : 180 / Math.PI;
      const alpha = res.alpha * scale;
      const beta = res.beta * scale;
      const gamma = res.gamma * scale;
      const a = alpha * Math.PI / 180;
      const b = beta * Math.PI / 180;
      const now = Date.now();

      // For Rz(alpha) Rx(beta) Ry(gamma), the phone's top edge is
      // [-sin(alpha) cos(beta), cos(alpha) cos(beta), sin(beta)] in ENU.
      // Calibrating the rear camera directly against the compass is wrong when tilted.
      const topEast = -Math.sin(a) * Math.cos(b);
      const topNorth = Math.cos(a) * Math.cos(b);
      const stableTop = Math.hypot(topEast, topNorth) >= 0.35;
      const freshCompass = heading !== null && now - headingAt <= 500;
      if (stableTop && freshCompass && (bias === null || now - biasAt >= 1000)) {
        const topAz = Math.atan2(topEast, topNorth) * 180 / Math.PI;
        const measuredBias = astro.normalizeDegrees(heading - topAz);
        bias = bias === null ? measuredBias : astro.lerpAngle(bias, measuredBias, 0.12);
        biasAt = now;
      }
      if (bias === null) {
        tracker.status = heading === null ? 'waiting-compass' : 'tilt-needed';
        return null;
      }
      tracker.status = 'tracking';
      const pose = astro.orientationToCamera(alpha, beta, gamma, 0);
      return { az: astro.normalizeDegrees(pose.az + bias), alt: pose.alt, roll: pose.roll };
    }

    function reset() {
      heading = null;
      headingAt = 0;
      bias = null;
      biasAt = 0;
      degrees = false;
      tracker.status = 'waiting-compass';
    }

    return tracker;
  }

  return { createTracker };
});
