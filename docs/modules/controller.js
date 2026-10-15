(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./astro'), require('./search'));
  else root.SkyController = factory(root.SkyAstro, root.SkySearch);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Astro, Search) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  class Controller {
    constructor(catalog) {
      this.catalog = catalog;
      this.index = Search.createIndex(catalog);
      this.camera = { az: 180, alt: 40, roll: 0 };
      this.observer = { latitude: 39.9042, longitude: 116.4074, label: '北京 · 示例位置', confirmed: false };
      this.fov = 70;
      this.target = null;
      this.tracking = false;
      this.ar = false;
      this.arReady = false;
      this.sound = true;
      this.lines = true;
      this.holdSince = null;
      this.celebrated = false;
      this.celebrateUntil = 0;
      this.width = 375;
      this.height = 700;
      this.offset = { az: 0, alt: 0 };
      this.rawCamera = null;
      this.onCelebrate = null;
    }
    setObserver(latitude, longitude, label) {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false;
      this.observer = { latitude, longitude, label: label || '手动位置', confirmed: true };
      this.holdSince = null;
      this.celebrated = false;
      this.celebrateUntil = 0;
      return true;
    }
    select(id) {
      this.target = this.index.get(id) || null;
      this.holdSince = null;
      this.celebrated = false;
      this.celebrateUntil = 0;
      return this.target;
    }
    horizontal(object, date) {
      const pos = Astro.precessJ2000 ? Astro.precessJ2000(object.ra, object.dec, date) : object;
      return Astro.equatorialToHorizontal(pos.ra, pos.dec, date, this.observer.latitude, this.observer.longitude);
    }
    updatePose(pose) {
      if (!pose || ![pose.az, pose.alt, pose.roll].every(Number.isFinite)) return;
      this.rawCamera = pose;
      if (!this.tracking) return;
      const blend = this.firstPose ? 1 : 0.22;
      this.camera.az = Astro.lerpAngle(this.camera.az, pose.az + this.offset.az, blend);
      this.camera.alt += (clamp(pose.alt + this.offset.alt, -90, 90) - this.camera.alt) * blend;
      this.camera.roll = Astro.lerpAngle(this.camera.roll, pose.roll, blend);
      this.firstPose = false;
    }
    setTracking(value) {
      this.tracking = value;
      this.firstPose = true;
      this.holdSince = null;
      if (!value) this.camera.roll = 0;
    }
    pan(dx, dy) {
      this.setTracking(false);
      this.camera.az = Astro.normalizeDegrees(this.camera.az - dx * this.fov / this.height);
      this.camera.alt = clamp(this.camera.alt + dy * this.fov / this.height, -89.5, 89.5);
    }
    zoom(factor) { this.fov = clamp(this.fov * factor, 25, 110); }
    calibrate(date) {
      if (!this.target || !this.rawCamera || !this.tracking || !this.observer.confirmed) return false;
      const h = this.horizontal(this.target, date);
      if (h.alt < 0) return false;
      this.offset = { az: h.az - this.rawCamera.az, alt: h.alt - this.rawCamera.alt };
      this.firstPose = true;
      this.updatePose(this.rawCamera);
      this.holdSince = null;
      return true;
    }
    sample(date, timestamp) {
      if (!this.target) return null;
      const h = this.horizontal(this.target, date);
      const p = Astro.project(Astro.horizontalToVector(h.az, h.alt), this.camera, this.width, this.height, this.fov);
      const below = h.alt < 0;
      // Dwell time rejects a fleeting crossing; leaving 2 degrees rearms the cue.
      if (p.angle > 2) { this.celebrated = false; this.holdSince = null; }
      const ready = !this.ar || (this.arReady && this.tracking && this.rawCamera && !this.firstPose);
      if (!below && this.observer.confirmed && ready && p.angle <= 1) {
        if (this.holdSince === null) this.holdSince = timestamp;
        if (!this.celebrated && timestamp - this.holdSince >= 650) {
          this.celebrated = true;
          this.celebrateUntil = timestamp + 1800;
          if (this.onCelebrate) this.onCelebrate();
        }
      } else this.holdSince = null;
      return { ...p, az: h.az, alt: h.alt, below, found: !!ready && this.celebrated && p.angle <= 2 };
    }
  }
  return Controller;
}));
