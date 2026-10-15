(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./astro'), require('./search'));
  else root.SkyRenderer = factory(root.SkyAstro, root.SkySearch);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Astro, Search) {
  'use strict';
  const palette = {
    sky: '#080f1c', skyTop: '#101e32', skyBottom: '#060b14', grid: '#1c2a3b',
    line: '#3e5774', star: '#e2eaf5', bright: '#fff2d9', muted: '#9cadc4',
    text: '#f1f4f8', accent: '#e4bd7c', red: '#ff777f', green: '#70dbaf',
    horizon: '#718f85', ground: '#10221f', label: '#0d1828', arShade: 'rgba(6,11,20,0.18)'
  };
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
  // IAU nominative names: https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx
  const constellationNames = {
    And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aql: 'Aquila', Aqr: 'Aquarius', Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga', Boo: 'Boötes',
    CMa: 'Canis Major', CMi: 'Canis Minor', CVn: 'Canes Venatici', Cae: 'Caelum', Cam: 'Camelopardalis', Cap: 'Capricornus', Car: 'Carina',
    Cas: 'Cassiopeia', Cen: 'Centaurus', Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon', Cir: 'Circinus', Cnc: 'Cancer', Col: 'Columba',
    Com: 'Coma Berenices', CrA: 'Corona Australis', CrB: 'Corona Borealis', Crt: 'Crater', Cru: 'Crux', Crv: 'Corvus', Cyg: 'Cygnus',
    Del: 'Delphinus', Dor: 'Dorado', Dra: 'Draco', Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax', Gem: 'Gemini', Gru: 'Grus',
    Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra', Hyi: 'Hydrus', Ind: 'Indus', LMi: 'Leo Minor', Lac: 'Lacerta', Leo: 'Leo',
    Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus', Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa', Mic: 'Microscopium', Mon: 'Monoceros',
    Mus: 'Musca', Nor: 'Norma', Oct: 'Octans', Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus', Per: 'Perseus',
    Phe: 'Phoenix', Pic: 'Pictor', PsA: 'Piscis Austrinus', Psc: 'Pisces', Pup: 'Puppis', Pyx: 'Pyxis', Ret: 'Reticulum', Scl: 'Sculptor',
    Sco: 'Scorpius', Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Sge: 'Sagitta', Sgr: 'Sagittarius', Tau: 'Taurus', Tel: 'Telescopium',
    Tra: 'Triangulum Australe', Tri: 'Triangulum', Tuc: 'Tucana', UMa: 'Ursa Major', UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo', Vol: 'Volans', Vul: 'Vulpecula'
  };
  function path(ctx, points, color, width) {
    if (points.length < 2) return;
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color; ctx.lineWidth = width || 1; ctx.stroke();
  }
  class Renderer {
    constructor(ctx, catalog) {
      this.ctx = ctx;
      this.catalog = catalog;
      this.cacheKey = '';
      this.grid = [];
      for (let alt = -60; alt <= 75; alt += 15) {
        const line = [];
        for (let az = 0; az <= 360; az += 3) line.push(Astro.horizontalToVector(az, alt));
        this.grid.push({ points: line, horizon: alt === 0 });
      }
      for (let az = 0; az < 360; az += 30) {
        const line = [];
        for (let alt = -87; alt <= 87; alt += 3) line.push(Astro.horizontalToVector(az, alt));
        this.grid.push({ points: line });
      }
    }
    updatePositions(model, date) {
      const key = [Math.floor(date.getTime() / 2000), model.observer.latitude, model.observer.longitude].join('/');
      if (key === this.cacheKey) return;
      this.cacheKey = key;
      const position = object => {
        const h = model.horizontal(object, date);
        return { ...object, vector: Astro.horizontalToVector(h.az, h.alt), alt: h.alt };
      };
      this.stars = this.catalog.stars.map(position);
      this.messier = this.catalog.messier.map(position);
      this.constellations = this.catalog.constellations.map(position);
      this.hip = new Map();
      this.stars.forEach(s => { if (s.hip) this.hip.set(s.hip, s); });
      (this.catalog.lineStars || []).map(position).forEach(s => this.hip.set(s.hip, s));
    }
    draw(model, date, now) {
      this.updatePositions(model, date);
      const ctx = this.ctx, w = model.width, h = model.height;
      const basis = Astro.cameraBasis(model.camera);
      const project = vector => Astro.project(vector, basis, w, h, model.fov);
      if (model.ar) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = palette.arShade; ctx.fillRect(0, 0, w, h);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, palette.skyTop); gradient.addColorStop(0.6, palette.sky); gradient.addColorStop(1, palette.skyBottom);
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      }
      ctx.save();
      this.grid.forEach(line => {
        if (model.ar && !line.horizon) return;
        let segment = [];
        line.points.forEach(v => {
          const p = project(v);
          if (p.behind || Math.abs(p.x) > w * 8 || Math.abs(p.y) > h * 8) {
            path(ctx, segment, line.horizon ? palette.horizon : palette.grid, line.horizon ? 1.2 : 0.65); segment = [];
          } else segment.push(p);
        });
        path(ctx, segment, line.horizon ? palette.horizon : palette.grid, line.horizon ? 1.2 : 0.65);
      });
      const english = model.language === 'en';
      const cardinals = english ? [[0,'N'],[90,'E'],[180,'S'],[270,'W']] : [[0,'北'],[90,'东'],[180,'南'],[270,'西']];
      ctx.font = '13px ' + font; ctx.textAlign = 'center'; ctx.fillStyle = palette.horizon;
      cardinals.forEach(([az, label]) => {
        const p = project(Astro.horizontalToVector(az, 0));
        if (p.visible) ctx.fillText(label + (english ? ' · Horizon' : ' · 地平线'), p.x, p.y + 19);
      });
      if (model.lines) {
        this.catalog.constellations.forEach(c => c.lines.forEach(pair => {
          const a = this.hip.get(pair[0]), b = this.hip.get(pair[1]);
          if (!a || !b) return;
          const pa = project(a.vector), pb = project(b.vector);
          if (!pa.behind && !pb.behind && Math.abs(pa.x) < w * 6 && Math.abs(pb.x) < w * 6 && Math.abs(pa.y) < h * 6 && Math.abs(pb.y) < h * 6) path(ctx, [pa, pb], palette.line, 0.75);
        }));
      }
      const labels = [];
      const label = (text, p, color, size, centered) => {
        ctx.font = size + 'px ' + font;
        const width = ctx.measureText(text).width;
        const box = { x: p.x + (centered ? -width/2 : 7), y: p.y + (centered ? 0 : -6), w: width, h: size + 3 };
        if (box.x < 8 || box.x + width > w - 8 || box.y < 8 || box.y > h - 8) return;
        // Leave the top controls readable; stars still occupy the full field.
        if (box.y < Math.min(228, h * 0.3)) return;
        if (w < 640 && box.y > h - (model.target ? 260 : 160)) return;
        if (labels.some(b => box.x < b.x + b.w + 7 && box.x + box.w + 7 > b.x && box.y < b.y + b.h + 3 && box.y + box.h + 3 > b.y)) return;
        labels.push(box);
        ctx.textAlign = 'left'; ctx.fillStyle = color; ctx.fillText(text, box.x, box.y);
      };
      const visibleStars = [];
      this.stars.forEach(star => {
        const p = project(star.vector);
        if (!p.visible) return;
        const r = Math.max(0.55, 2.3 - star.mag * 0.29);
        ctx.globalAlpha = star.alt < 0 ? 0.28 : Math.min(1, 1.4 - star.mag * 0.1);
        ctx.fillStyle = star.mag < 1 ? palette.bright : palette.star;
        if (star.mag < 1.5) {
          ctx.globalAlpha *= 0.14; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = star.alt < 0 ? 0.3 : 1;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        visibleStars.push({star,p});
      });
      ctx.globalAlpha = 1;
      visibleStars.sort((a,b) => a.star.mag - b.star.mag).slice(0, 22).forEach(({star,p}) => {
        if (star.name && star.mag < 3.6) label(Search.displayName(star, model.language), p, palette.muted, 11, false);
      });
      if (model.lines) this.constellations.forEach(c => {
        const p = project(c.vector);
        if (p.visible && c.alt >= 0) label(english ? (constellationNames[c.id] || c.id) : c.name, p, palette.muted, 13, true);
      });
      this.messier.forEach(m => {
        const p = project(m.vector);
        if (!p.visible) return;
        ctx.globalAlpha = m.alt < 0 ? 0.3 : 0.8;
        ctx.strokeStyle = palette.accent; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 4, 3, -0.4, 0, Math.PI * 2); ctx.stroke();
        if (model.fov < 55 || (m.mag !== null && m.mag < 6)) label(m.id, p, palette.accent, 10, false);
      });
      ctx.globalAlpha = 1;
      const result = model.sample(date, now);
      if (result) this.drawGuide(result, model);
      this.drawReticle(w / 2, h / 2, result && result.found);
      ctx.restore();
      return result;
    }
    drawReticle(x, y, found) {
      const ctx = this.ctx;
      ctx.strokeStyle = found ? palette.green : palette.accent; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke();
      [[-22,0,-16,0],[16,0,22,0],[0,-22,0,-16],[0,16,0,22]].forEach(v => path(ctx,[{x:x+v[0],y:y+v[1]},{x:x+v[2],y:y+v[3]}],ctx.strokeStyle,1));
      ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x,y,1.5,0,Math.PI*2); ctx.fill();
    }
    drawGuide(p, model) {
      const ctx = this.ctx, w = model.width, h = model.height, cx = w/2, cy = h/2;
      const color = p.visible ? palette.green : palette.red;
      let dx = p.directionX, dy = p.directionY;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) { dx = p.x-cx; dy=p.y-cy; }
      let length = Math.hypot(dx,dy);
      if (length < 0.001) { dx = 0; dy = -1; length = 1; }
      dx /= length; dy /= length;
      const horizontalRoom = dx > 0 ? w/2 - 78 : w/2 - 30;
      const verticalRoom = dy > 0 ? h/2 - Math.min(model.target ? 260 : 160, h * 0.3) : h/2 - Math.min(234, h * 0.3);
      let endDistance = p.visible ? Math.hypot(p.x-cx,p.y-cy) : Math.min(horizontalRoom/(Math.abs(dx)||1e-9),verticalRoom/(Math.abs(dy)||1e-9));
      const ex = cx + dx * endDistance, ey = cy + dy * endDistance;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
      if (endDistance > 26) {
        path(ctx,[{x:cx,y:cy},{x:ex,y:ey}],color,1.8);
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex-dx*11-dy*5,ey-dy*11+dx*5); ctx.lineTo(ex-dx*11+dy*5,ey-dy*11-dx*5); ctx.closePath(); ctx.fill();
      }
      if (p.visible) {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.found?22:17,0,Math.PI*2); ctx.stroke();
      }
      const text = (p.behind ? (model.language === 'en' ? 'Turn around ' : '转向背后 ') : '') + p.angle.toFixed(1) + '°';
      ctx.font = '13px ' + font;
      const textWidth = ctx.measureText(text).width;
      const tx = Math.max(textWidth/2+12, Math.min(w-textWidth/2-12,cx+dx*Math.max(56,endDistance*0.5)));
      const ty = Math.max(30,Math.min(h-30,cy+dy*Math.max(56,endDistance*0.5)-12));
      ctx.fillStyle = palette.label; ctx.fillRect(tx-textWidth/2-8,ty-16,textWidth+16,24);
      ctx.fillStyle=color; ctx.textAlign='center'; ctx.fillText(text,tx,ty);
    }
  }
  Renderer.palette = palette;
  return Renderer;
}));
