(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = new SkyController(SkyCatalog);
  const canvas = $('sky'), ctx = canvas.getContext('2d');
  const renderer = new SkyRenderer(ctx, SkyCatalog);
  const sound = BrowserMedia.createSound('assets/chime.wav');
  const pad = n => String(n).padStart(2, '0');
  const storage = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  };
  let language = storage.get('xunxing.language') === 'en' ? 'en' : 'zh';
  let toastTimer, celebrationTimer, lastUI = 0, pointer = null, searchFrame = null;
  let resultTotal = 0, resultOffset = -1, selectedIndex = -1;
  const saved = storage.get('xunxing.observer');
  if (saved) model.setObserver(saved.latitude, saved.longitude, saved.label);
  model.sound = storage.get('xunxing.sound') !== false;
  model.lines = storage.get('xunxing.lines') !== false;
  const text = key => WebCopy[language][key] || SkyI18n.text(language, key);
  $('about-name').textContent = SkyI18n.about.name;
  SkyI18n.about.sections.forEach(copy => {
    const section = document.createElement('section'); section.className = 'about-section'; section.lang = copy.language;
    function appendText(parent, className, value) {
      const element = document.createElement('div'); element.className = className; element.textContent = value; parent.append(element); return element;
    }
    appendText(section, 'about-language', copy.label);
    appendText(section, 'about-copy', copy.bio); appendText(section, 'about-copy', copy.story);
    const links = appendText(section, 'about-links', '');
    [['homepage', copy.homepageLabel], ['email', copy.emailLabel]].forEach(([kind, label]) => {
      const link = document.createElement('a'); link.className = 'about-link';
      link.href = kind === 'email' ? 'mailto:' + SkyI18n.about.email : SkyI18n.about.homepage;
      if (kind === 'homepage') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      appendText(link, 'about-link-heading', label + ' ↗'); appendText(link, 'about-link-value', SkyI18n.about[kind]); links.append(link);
    });
    appendText(section, 'about-copy', copy.feedback);
    const wish = appendText(section, 'about-wish', ''); appendText(wish, 'about-title', copy.title); appendText(wish, 'about-copy', copy.wish);
    $('about-sections').append(section);
  });
  function notify(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    const dialog = [...document.querySelectorAll('dialog[open]')].pop();
    (dialog || document.body).append($('toast'));
    toastTimer = setTimeout(() => { $('toast').hidden = true; document.body.append($('toast')); }, 3000);
  }
  function toggleState(id, value) { $(id).classList.toggle('is-on', value); $(id).setAttribute('aria-checked', String(value)); }
  function updateLocationLabel() {
    let label = model.observer.label;
    if (!model.observer.confirmed) label = text('sampleLocation');
    else if (['手动位置', 'Manual location'].includes(label)) label = text('manualLocation');
    else if (['当前位置', 'Current location'].includes(label)) label = text('currentLocation');
    $('location-label').textContent = label + (model.observer.confirmed ? ' · ' + model.observer.latitude.toFixed(2) + '°, ' + model.observer.longitude.toFixed(2) + '°' : '');
  }
  function setLanguage(value) {
    language = value === 'en' ? 'en' : 'zh'; model.language = language; storage.set('xunxing.language', language);
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = text('appName') + (language === 'en' ? ' · 追星人' : ' · Astertrail');
    document.querySelectorAll('[data-text]').forEach(el => { el.textContent = text(el.dataset.text); });
    document.querySelectorAll('[data-label]').forEach(el => { el.setAttribute('aria-label', text(el.dataset.label)); });
    $('search').placeholder = text('searchPlaceholder');
    $('data-sources').href = language === 'en' ? 'DATA_SOURCES.en.md' : 'DATA_SOURCES.md';
    ['zh', 'en'].forEach(lang => { $('language-' + lang).classList.toggle('selected', lang === language); $('language-' + lang).setAttribute('aria-pressed', String(lang === language)); });
    updateLocationLabel(); if (!$('search-dropdown').hidden) updateSearch(); syncMode(); updateSensorUI(); updateOfflineUI(); lastUI = 0;
  }
  function closeSearch() {
    $('search-dropdown').hidden = true; $('clear-search').hidden = true;
    $('search').setAttribute('aria-expanded', 'false'); $('search').removeAttribute('aria-activedescendant'); selectedIndex = -1;
    if (searchFrame !== null) cancelAnimationFrame(searchFrame); searchFrame = null;
  }
  function choose(id) { model.select(id); $('search').value = ''; closeSearch(); $('search').blur(); updateSensorUI(); lastUI = 0; }
  function renderResults(offset) {
    const page = model.index.browse($('search').value, language, offset, 60);
    resultTotal = page.total; resultOffset = offset;
    $('search-summary').textContent = $('search').value.trim() ? text('matches') : text('allTargets');
    $('search-count').textContent = resultTotal + ' ' + text(resultTotal === 1 ? 'target' : 'targets');
    $('results').style.height = Math.min(280, resultTotal ? resultTotal * 60 : 88) + 'px';
    const content = document.createDocumentFragment();
    function spacer(height) { const element = document.createElement('div'); element.style.height = height + 'px'; element.setAttribute('aria-hidden', 'true'); content.append(element); }
    spacer(offset * 60);
    if (!page.items.length) { const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = text('empty'); content.append(empty); }
    const date = new Date();
    page.items.forEach((item, i) => {
      const index = offset + i, horizontal = model.horizontal(item, date);
      const button = document.createElement('button'); button.className = 'result'; button.setAttribute('role', 'option'); button.id = 'result-' + index;
      button.setAttribute('aria-selected', String(index === selectedIndex)); button.setAttribute('aria-posinset', String(index + 1)); button.setAttribute('aria-setsize', String(resultTotal)); button.classList.toggle('selected', index === selectedIndex);
      const main = document.createElement('span'); main.className = 'result-main';
      const name = document.createElement('span'); name.className = 'result-name'; name.textContent = SkySearch.displayName(item, language);
      const meta = document.createElement('span'); meta.className = 'result-meta'; meta.textContent = SkySearch.typeName(item, language) + ' · ' + (horizontal.alt < 0 ? text('below') : text('altitude') + ' ' + horizontal.alt.toFixed(0) + '°');
      const id = document.createElement('span'); id.className = 'result-id'; id.textContent = item.kind === 'messier' ? item.id : item.hip ? 'HIP ' + item.hip : '';
      main.append(name, meta); button.append(main, id); button.addEventListener('click', () => choose(item.id)); content.append(button);
    });
    spacer(Math.max(0, resultTotal - offset - page.items.length) * 60); $('results').replaceChildren(content);
  }
  function updateSearch() {
    selectedIndex = -1; $('results').scrollTop = 0; renderResults(0);
    $('search-dropdown').hidden = false; $('clear-search').hidden = false; $('search').setAttribute('aria-expanded', 'true'); $('search').removeAttribute('aria-activedescendant');
  }
  $('results').addEventListener('scroll', () => {
    if (searchFrame !== null) return;
    searchFrame = requestAnimationFrame(() => {
      searchFrame = null;
      const offset = Math.max(0, Math.min(Math.floor($('results').scrollTop / 60) - 8, resultTotal - 60));
      if (offset !== resultOffset && !$('search-dropdown').hidden) renderResults(offset);
    });
  });
  $('search').addEventListener('input', updateSearch); $('search').addEventListener('focus', updateSearch);
  $('search').addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeSearch(); $('search').blur(); }
    if (event.key === 'Enter' && resultTotal) { event.preventDefault(); choose(model.index.browse($('search').value, language, Math.max(0, selectedIndex), 1).items[0].id); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); if (!resultTotal) return;
      selectedIndex = (selectedIndex + (event.key === 'ArrowDown' ? 1 : -1) + resultTotal) % resultTotal;
      const top = selectedIndex * 60, list = $('results');
      if (top < list.scrollTop) list.scrollTop = top;
      else if (top + 60 > list.scrollTop + list.clientHeight) list.scrollTop = top + 60 - list.clientHeight;
      renderResults(Math.max(0, Math.min(selectedIndex - 8, resultTotal - 60)));
      $('search').setAttribute('aria-activedescendant', 'result-' + selectedIndex);
    }
  });
  $('clear-search').onclick = () => { $('search').value = ''; closeSearch(); $('search').blur(); };
  $('dismiss-target').onclick = () => { model.select(null); $('celebration').hidden = true; lastUI = 0; };
  // Match the camera crop to the perspective projection, not to the FOV ratio.
  const zoomForFov = fov => Math.tan(35 * Math.PI / 180) / Math.tan(fov * Math.PI / 360);
  function fitCamera() {
    const video = $('camera');
    if (!(model.ar || arStarting) || !video.videoWidth || !video.videoHeight) {
      video.style.width = video.style.height = video.style.left = video.style.top = '';
      return;
    }
    // Explicit cover dimensions avoid relying on the native video layer to
    // apply object-fit and a scale transform together at AR startup.
    const zoom = Math.max(1, zoomForFov(model.fov));
    const scale = Math.max(model.width / video.videoWidth, model.height / video.videoHeight) * zoom;
    const width = video.videoWidth * scale, height = video.videoHeight * scale;
    video.style.width = width + 'px'; video.style.height = height + 'px';
    video.style.left = (model.width - width) / 2 + 'px'; video.style.top = (model.height - height) / 2 + 'px';
  }
  $('camera').addEventListener('loadedmetadata', fitCamera);
  $('camera').addEventListener('resize', fitCamera);
  function syncZoom() {
    const magnification = zoomForFov(model.fov), label = magnification.toFixed(1) + '×';
    $('zoom').min = String(zoomForFov(model.ar ? 70 : 110));
    $('zoom').max = String(zoomForFov(25)); $('zoom').value = String(magnification);
    $('zoom').disabled = arStarting; $('zoom').setAttribute('aria-valuetext', label);
    $('zoom-value').textContent = label;
    fitCamera();
    lastUI = 0;
  }
  function zoomBy(factor) {
    if (arStarting) return;
    model.zoom(factor); if (model.ar) model.fov = Math.min(70, model.fov);
    syncZoom();
  }
  $('zoom').addEventListener('input', () => {
    const magnification = Number($('zoom').value);
    if (arStarting || !Number.isFinite(magnification) || magnification <= 0) return;
    const fov = 360 / Math.PI * Math.atan(Math.tan(35 * Math.PI / 180) / magnification);
    zoomBy(fov / model.fov);
  });
  $('lines').onclick = () => { model.lines = !model.lines; storage.set('xunxing.lines', model.lines); toggleState('lines', model.lines); };
  $('sound').onclick = () => { model.sound = !model.sound; storage.set('xunxing.sound', model.sound); toggleState('sound', model.sound); };
  $('settings').onclick = () => { closeSearch(); $('settings-dialog').showModal(); };
  $('settings-close').onclick = () => $('settings-dialog').close();
  $('about').onclick = () => { closeSearch(); $('about-dialog').showModal(); };
  $('about-close').onclick = () => $('about-dialog').close();
  $('language-zh').onclick = () => setLanguage('zh'); $('language-en').onclick = () => setLanguage('en');
  $('help').onclick = () => $('help-dialog').showModal(); $('help-close').onclick = () => $('help-dialog').close();
  function showLocation() { $('latitude').value = model.observer.latitude; $('longitude').value = model.observer.longitude; $('location-error').textContent = ''; $('location-dialog').showModal(); }
  $('location').onclick = showLocation; $('location-close').onclick = () => $('location-dialog').close();
  function persistObserver() { storage.set('xunxing.observer', model.observer); $('location-dialog').close(); updateLocationLabel(); }
  $('location-form').onsubmit = event => {
    event.preventDefault(); const lat = $('latitude').value.trim(), lon = $('longitude').value.trim();
    if (!lat || !lon || !model.setObserver(Number(lat), Number(lon), text('manualLocation'))) { $('location-error').textContent = text('invalidLocation'); return; }
    persistObserver();
  };
  $('locate').onclick = () => {
    if (!navigator.geolocation) { $('location-error').textContent = text('browserLocation'); return; }
    $('locate').disabled = true; $('locate').textContent = text('locating');
    navigator.geolocation.getCurrentPosition(position => { model.setObserver(position.coords.latitude, position.coords.longitude, text('currentLocation')); persistObserver(); $('locate').disabled = false; $('locate').textContent = text('locate'); }, () => { $('location-error').textContent = text('browserLocation'); $('locate').disabled = false; $('locate').textContent = text('locate'); }, { timeout: 10000 });
  };
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }
  }));
  const touches = new Map();
  let pinchDistance = null;
  function pan(dx, dy) { if (tracker.active) stopTracking(); model.pan(dx, dy); }
  canvas.addEventListener('pointerdown', event => {
    closeSearch(); if (model.ar || arStarting) return;
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    canvas.setPointerCapture(event.pointerId); pinchDistance = null;
  });
  canvas.addEventListener('pointermove', event => {
    const previous = touches.get(event.pointerId); if (!previous || model.ar || arStarting) return;
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (touches.size === 1) pan(event.clientX - previous.x, event.clientY - previous.y);
    else {
      const [a,b] = [...touches.values()], distance = Math.hypot(a.x-b.x,a.y-b.y);
      if (pinchDistance && distance > 4) zoomBy(pinchDistance/distance);
      pinchDistance = distance;
    }
  });
  function releasePointer(event) { touches.delete(event.pointerId); pinchDistance = null; }
  canvas.addEventListener('pointerup', releasePointer); canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('wheel', event => { event.preventDefault(); if (!model.ar) zoomBy(Math.exp(event.deltaY * .001)); }, { passive: false });
  window.addEventListener('keydown', event => {
    if (event.target.matches('input') || document.querySelector('dialog[open]') || model.ar || arStarting) return;
    const moves = { ArrowLeft: [28, 0], ArrowRight: [-28, 0], ArrowUp: [0, 28], ArrowDown: [0, -28] };
    if (moves[event.key]) { event.preventDefault(); pan(...moves[event.key]); }
    if (event.key === '+' || event.key === '=') zoomBy(.8); if (event.key === '-') zoomBy(1.25);
  });
  model.onCelebrate = () => {
    $('app').classList.remove('shaking'); void $('app').offsetWidth; $('app').classList.add('shaking');
    $('celebration-sub').textContent = SkySearch.displayName(model.target, language) + ' · ' + text('center'); $('celebration').hidden = false;
    if (model.sound && !sound.play()) notify(text('audioError'));
    if (navigator.vibrate) navigator.vibrate([60, 50, 100]);
    clearTimeout(celebrationTimer); celebrationTimer = setTimeout(() => { $('celebration').hidden = true; $('app').classList.remove('shaking'); }, 1800);
  };
  function resize() { const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 3); model.width = rect.width; model.height = rect.height; canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); fitCamera(); }
  let renderFrame = null, previousFrame = 0;
  function render(frameTime) {
    if (document.hidden) { renderFrame = null; return; }
    if (frameTime - previousFrame < 32) { renderFrame = requestAnimationFrame(render); return; }
    previousFrame = frameTime;
    const now = Date.now(), date = new Date(now), result = renderer.draw(model, date, now);
    if (now - lastUI > 200) {
      lastUI = now; $('date').textContent = date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate()); $('time').textContent = pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
      const az = SkyAstro.normalizeDegrees(model.camera.az);
      $('heading').textContent = text('directions')[Math.round(az / 45) % 8] + ' ' + Math.round(az) + '° · ' + Math.round(model.fov) + '°';
      $('target-panel').hidden = !model.target; $('welcome').hidden = !!model.target;
      if (model.target && result) {
        $('target-name').textContent = SkySearch.displayName(model.target, language);
        $('target-caption').textContent = (model.target.kind === 'messier' ? model.target.id + ' · ' : '') + SkySearch.typeName(model.target, language) + ' · ' + text('altitude') + ' ' + result.alt.toFixed(0) + '°';
        $('angle').textContent = result.angle.toFixed(1) + '°'; $('angle').classList.toggle('inside', result.visible);
        $('target-status').className = result.below ? '' : result.visible ? 'status-in' : 'status-out';
        $('target-status').textContent = text(model.ar && !model.tracking ? 'arWaiting' : result.below ? 'statusBelow' : result.angle <= 1 && result.found ? 'statusFound' : result.visible ? 'statusInside' : result.behind ? 'statusBehind' : 'statusOutside');
        const directions = [];
        if (Math.abs(result.directionX) > .25) directions.push(text(result.directionX > 0 ? 'right' : 'left'));
        if (Math.abs(result.directionY) > .35) directions.push(text(result.directionY > 0 ? 'lower' : 'raise'));
        $('direction-prompt').textContent = result.below ? text('directionBelow') : result.angle <= 1 && result.found ? text('directionFound') : result.angle <= 1 ? text('directionNear') : directions.join(' · ') || text('direction');
      }
    }
    renderFrame = requestAnimationFrame(render);
  }
  let arStarting = false, arGeneration = 0, previousFov = model.fov;
  let sensorStatus = 'stopped', offlineState = 'offlinePreparing', updateWorker = null, installPrompt = null;
  const statusKeys = { requesting: 'sensorWaiting', waiting: 'sensorWaiting', 'tilt-needed': 'sensorTilt', 'calibration-needed': 'sensorCalibrate', denied: 'sensorDenied', unavailable: 'sensorUnavailable', unsupported: 'sensorUnavailable', insecure: 'sensorInsecure', tracking: 'trackingReady', stopped: 'off' };
  const tracker = BrowserSensors.createTracker(SkyAstro, {
    onPose(pose) { if (!model.tracking) model.setTracking(true); model.updatePose(pose); },
    onStatus(status) {
      sensorStatus = status;
      if (status !== 'tracking') { model.setTracking(false); model.rawCamera = null; }
      updateSensorUI();
    }
  });
  const camera = BrowserMedia.createCamera($('camera'), { onEnded() { exitAR(); notify(text('cameraUnavailable')); } });
  function updateSensorUI() {
    const active = sensorStatus !== 'stopped' && !['denied','insecure','unsupported'].includes(sensorStatus);
    toggleState('tracking', active);
    const message = text(statusKeys[sensorStatus] || 'sensorWaiting');
    $('tracking-state').textContent = sensorStatus === 'stopped' ? '' : message;
    $('sensor-hint').hidden = sensorStatus === 'stopped' || sensorStatus === 'tracking';
    $('sensor-hint').textContent = message;
    $('calibrate-north').disabled = !tracker.active;
    $('calibrate-target').disabled = !tracker.active || !model.target;
    lastUI = 0;
  }
  function syncMode() {
    $('mode-ar').classList.toggle('selected', model.ar || arStarting);
    $('mode-sky').classList.toggle('selected', !model.ar && !arStarting);
    $('mode-ar').setAttribute('aria-pressed', String(model.ar || arStarting));
    $('mode-sky').setAttribute('aria-pressed', String(!model.ar && !arStarting));
    $('follow').textContent = text(arStarting ? 'cameraStarting' : model.ar ? 'returnChart' : 'startAR');
    $('mode-hint').textContent = text(model.ar ? 'arHint' : 'previewHint');
    // Lay out the video before play(), while the opaque chart still covers it.
    $('camera').hidden = !model.ar && !arStarting;
    syncZoom();
    $('app').classList.toggle('ar-mode', model.ar);
  }
  function startTracking() {
    model.offset = { az: 0, alt: 0 }; model.rawCamera = null; model.setTracking(false);
    return tracker.start();
  }
  function stopTracking() { tracker.stop(); model.setTracking(false); model.rawCamera = null; }
  function exitAR() {
    arGeneration++; arStarting = false; camera.stop();
    touches.clear(); pinchDistance = null;
    if (model.ar) model.fov = previousFov;
    model.ar = false; model.arReady = false; model.holdSince = null; syncMode();
  }
  async function startAR() {
    closeSearch();
    if (model.ar || arStarting) { exitAR(); return; }
    if (!window.isSecureContext) { notify(text('sensorInsecure')); return; }
    if (!model.observer.confirmed) { showLocation(); return; }
    sound.unlock();
    // Invoke iOS permission in this click, before waiting for the camera promise.
    if (!tracker.active) startTracking();
    previousFov = model.fov; touches.clear(); pinchDistance = null;
    arStarting = true; const token = ++arGeneration; syncMode();
    try {
      const ready = await camera.start();
      if (token !== arGeneration || !ready) return;
      model.fov = Math.min(previousFov, 70); model.ar = true; model.arReady = true;
      arStarting = false; syncMode(); notify(text(previousFov > 70 ? 'cameraReadyLimited' : 'cameraReady'));
    } catch (_) {
      if (token !== arGeneration) return;
      exitAR(); notify(text('cameraUnavailable'));
    }
  }
  $('tracking').onclick = () => {
    if (tracker.active) { if (model.ar || arStarting) exitAR(); stopTracking(); }
    else { sound.unlock(); startTracking(); }
  };
  $('follow').onclick = startAR; $('mode-ar').onclick = () => { if (!model.ar && !arStarting) startAR(); };
  $('mode-sky').onclick = () => { closeSearch(); exitAR(); };
  $('calibrate-north').onclick = () => {
    model.offset = { az: 0, alt: 0 }; model.firstPose = true;
    notify(text(tracker.calibrate(0) ? 'northDone' : 'calibrationFailed'));
  };
  $('calibrate-target').onclick = () => {
    const date = new Date();
    if (!model.target || !model.observer.confirmed || model.horizontal(model.target, date).alt < 0) { notify(text('calibrateError')); return; }
    if (tracker.status !== 'tracking') tracker.calibrate(model.horizontal(model.target, date).az);
    notify(text(model.calibrate(date) ? 'calibrated' : 'calibrateError'));
  };
  document.addEventListener('pointerdown', () => { if (model.sound) sound.unlock(); }, { passive: true });
  document.addEventListener('keydown', () => { if (model.sound) sound.unlock(); });
  function suspend() {
    closeSearch(); exitAR(); stopTracking(); sound.stop(); touches.clear(); pinchDistance = null;
    model.holdSince = null; clearTimeout(celebrationTimer); $('celebration').hidden = true; $('app').classList.remove('shaking');
    if (renderFrame !== null) cancelAnimationFrame(renderFrame); renderFrame = null;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    else if (renderFrame === null) { resize(); renderFrame = requestAnimationFrame(render); }
  });
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pageshow', () => { if (renderFrame === null && !document.hidden) { resize(); renderFrame = requestAnimationFrame(render); } });
  function updateOfflineUI() {
    $('offline-status').textContent = text(navigator.onLine === false ? 'offlineActive' : offlineState);
    $('update-app').hidden = !updateWorker;
  }
  window.addEventListener('online', updateOfflineUI); window.addEventListener('offline', updateOfflineUI);
  $('install').onclick = () => $('install-dialog').showModal();
  $('install-close').onclick = () => $('install-dialog').close();
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('install-now').hidden = false; });
  $('install-now').onclick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt(); installPrompt = null; $('install-now').hidden = true;
  };
  window.addEventListener('appinstalled', () => { installPrompt = null; $('install-now').hidden = true; $('install-dialog').close(); });
  let applyingUpdate = false;
  $('update-app').onclick = () => {
    if (model.ar || arStarting) { notify(text('updateBusy')); return; }
    if (updateWorker) { applyingUpdate = true; suspend(); updateWorker.postMessage({ type: 'SKIP_WAITING' }); }
  };
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (applyingUpdate) location.reload(); });
    navigator.serviceWorker.register('./sw.js').then(registration => {
      const waiting = () => { updateWorker = registration.waiting; updateOfflineUI(); };
      waiting(); registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') waiting();
          if (worker.state === 'redundant' && !registration.active) { offlineState = 'offlineUnavailable'; updateOfflineUI(); }
        });
      });
      navigator.serviceWorker.ready.then(() => { offlineState = 'offlineReady'; updateOfflineUI(); });
    }).catch(() => { offlineState = 'offlineUnavailable'; updateOfflineUI(); });
  } else offlineState = 'offlineUnavailable';
  setLanguage(language); toggleState('sound', model.sound); toggleState('lines', model.lines);
  resize(); window.addEventListener('resize', resize); if (window.visualViewport) window.visualViewport.addEventListener('resize', resize); renderFrame = requestAnimationFrame(render);
  if (!saved) showLocation();
  window.Astertrail = { model, renderer, choose, resize, setLanguage, tracker, camera, startAR, exitAR };
}());
