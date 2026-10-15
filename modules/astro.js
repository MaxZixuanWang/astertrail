(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SkyAstro = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var RAD = Math.PI / 180;
  var DEG = 180 / Math.PI;

  function normalizeDegrees(angle) {
    return ((angle % 360) + 360) % 360;
  }

  function lerpAngle(a, b, amount) {
    return normalizeDegrees(a + (normalizeDegrees(b - a + 180) - 180) * amount);
  }

  function julianDate(date) {
    return (typeof date === 'number' ? date : date.getTime()) / 86400000 + 2440587.5;
  }

  // USNO approximate GMST, UTC ~= UT1. Longitude is east-positive, degrees.
  // https://aa.usno.navy.mil/faq/GAST
  function localSiderealTime(date, longitude) {
    var jd = julianDate(date);
    var midnight = Math.floor(jd - 0.5) + 0.5;
    var hours = (jd - midnight) * 24;
    var centuries = (jd - 2451545) / 36525;
    var gmst = 6.697375 + 0.065709824279 * (midnight - 2451545) +
      1.0027379 * hours + 0.0000258 * centuries * centuries;
    return normalizeDegrees(gmst * 15 + longitude);
  }

  // IAU 1976 precession polynomials, J2000 to mean equator/equinox of date.
  // Coefficients: Lieske (1979), as documented by ERFA's eraPrec76:
  // https://github.com/liberfa/erfa/blob/master/src/prec76.c
  // An independent spherical-coordinate implementation; no proper motion,
  // nutation, annual aberration or atmospheric refraction is applied.
  function precessJ2000(ra, dec, date) {
    var t = (julianDate(date) - 2451545) / 36525;
    var zeta = (2306.2181 * t + 0.30188 * t * t + 0.017998 * t * t * t) * RAD / 3600;
    var z = (2306.2181 * t + 1.09468 * t * t + 0.018203 * t * t * t) * RAD / 3600;
    var theta = (2004.3109 * t - 0.42665 * t * t - 0.041833 * t * t * t) * RAD / 3600;
    var a = ra * RAD + zeta;
    var d = dec * RAD;
    var east = Math.cos(d) * Math.sin(a);
    var equator = Math.cos(theta) * Math.cos(d) * Math.cos(a) - Math.sin(theta) * Math.sin(d);
    var pole = Math.sin(theta) * Math.cos(d) * Math.cos(a) + Math.cos(theta) * Math.sin(d);
    return {
      ra: normalizeDegrees((Math.atan2(east, equator) + z) * DEG),
      dec: Math.atan2(pole, Math.hypot(east, equator)) * DEG
    };
  }

  // RA and Dec must use the equator/equinox of date; call precessJ2000 for
  // J2000 catalog entries. All input/output angles are degrees.
  // Azimuth: north = 0, east = 90. Altitude: horizon = 0, zenith = 90.
  function equatorialToHorizontal(ra, dec, date, latitude, longitude) {
    var hourAngle = (localSiderealTime(date, longitude) - ra) * RAD;
    var d = dec * RAD;
    var p = latitude * RAD;
    var east = -Math.cos(d) * Math.sin(hourAngle);
    var north = Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.cos(hourAngle) * Math.sin(p);
    var up = Math.sin(d) * Math.sin(p) + Math.cos(d) * Math.cos(hourAngle) * Math.cos(p);
    return {
      az: normalizeDegrees(Math.atan2(east, north) * DEG),
      alt: Math.atan2(up, Math.hypot(east, north)) * DEG
    };
  }

  function horizontalToVector(az, alt) {
    var a = az * RAD;
    var h = alt * RAD;
    return [Math.sin(a) * Math.cos(h), Math.cos(a) * Math.cos(h), Math.sin(h)];
  }

  // roll > 0 means the phone tilts clockwise, its screen top toward the
  // viewer's right. Sky objects rotate counterclockwise on the screen.
  function cameraBasis(camera) {
    var a = camera.az * RAD;
    var h = camera.alt * RAD;
    var r = (camera.roll || 0) * RAD;
    var right = [Math.cos(a), -Math.sin(a), 0];
    var up = [-Math.sin(a) * Math.sin(h), -Math.cos(a) * Math.sin(h), Math.cos(h)];
    var cosine = Math.cos(r);
    var sine = Math.sin(r);
    return {
      forward: horizontalToVector(camera.az, camera.alt),
      right: right.map(function (value, i) { return value * cosine - up[i] * sine; }),
      up: up.map(function (value, i) { return value * cosine + right[i] * sine; })
    };
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  // Perspective projection. fovDeg is the VERTICAL field of view. camera
  // accepts {az,alt,roll} or a reusable cameraBasis result. directionX/Y is
  // the unit screen direction along the shortest great-circle path, even
  // behind the camera; exact antipodes consistently point upward.
  function project(vector, camera, width, height, fovDeg) {
    var basis = camera.forward ? camera : cameraBasis(camera);
    var length = Math.hypot(vector[0], vector[1], vector[2]);
    var horizontal = dot(vector, basis.right) / length;
    var vertical = -dot(vector, basis.up) / length;
    var depth = dot(vector, basis.forward) / length;
    var tangent = Math.hypot(horizontal, vertical);
    var angle = Math.atan2(tangent, depth) * DEG;
    var directionX = tangent > 1e-12 ? horizontal / tangent : 0;
    var directionY = tangent > 1e-12 ? vertical / tangent : (depth < 0 ? -1 : 0);
    var focalLength = height / (2 * Math.tan(fovDeg * RAD / 2));
    var denominator = Math.max(Math.abs(depth), 1e-9);
    var x = width / 2 + focalLength * horizontal / denominator;
    var y = height / 2 + focalLength * vertical / denominator;
    var behind = depth <= 0;
    return {
      x: x,
      y: y,
      visible: !behind && x >= -1e-7 && x <= width + 1e-7 && y >= -1e-7 && y <= height + 1e-7,
      behind: behind,
      angle: angle,
      directionX: directionX,
      directionY: directionY
    };
  }

  // W3C Z-X'-Y'' intrinsic rotation, ENU world frame. Inputs are DEGREES.
  // https://www.w3.org/TR/orientation-event/#alternate-representations
  // wx.onDeviceMotionChange documents radians: its adapter must convert
  // radians to degrees before calling this function. No magnitude guessing.
  // The viewing direction is the phone's back (-device Z), not its top.
  function orientationToCamera(alpha, beta, gamma, screenAngle) {
    var a = alpha * RAD;
    var b = beta * RAD;
    var g = gamma * RAD;
    var s = (screenAngle || 0) * RAD;
    var ca = Math.cos(a), sa = Math.sin(a);
    var cb = Math.cos(b), sb = Math.sin(b);
    var cg = Math.cos(g), sg = Math.sin(g);
    var right = [ca * cg - sa * sb * sg, sa * cg + ca * sb * sg, -cb * sg];
    var top = [-sa * cb, ca * cb, sb];
    var forward = [-sa * sb * cg - ca * sg, ca * sb * cg - sa * sg, -cb * cg];
    var screenTop = top.map(function (value, i) { return value * Math.cos(s) + right[i] * Math.sin(s); });
    var az = normalizeDegrees(Math.atan2(forward[0], forward[1]) * DEG);
    var alt = Math.atan2(forward[2], Math.hypot(forward[0], forward[1])) * DEG;
    var basis = cameraBasis({ az: az, alt: alt, roll: 0 });
    return {
      az: az,
      alt: alt,
      roll: Math.atan2(dot(screenTop, basis.right), dot(screenTop, basis.up)) * DEG
    };
  }

  return {
    normalizeDegrees: normalizeDegrees,
    lerpAngle: lerpAngle,
    localSiderealTime: localSiderealTime,
    precessJ2000: precessJ2000,
    equatorialToHorizontal: equatorialToHorizontal,
    horizontalToVector: horizontalToVector,
    cameraBasis: cameraBasis,
    project: project,
    orientationToCamera: orientationToCamera
  };
});
