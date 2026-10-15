(function (root) {
  'use strict';
  root.WebCopy = {
    zh: {
      previewHint: '星图可拖动浏览 · 一键进入实景 AR', previewHelp: '手机可拖动、双指缩放星图；电脑可用鼠标和方向键。实景 AR 中请转动手机，不支持拖动和缩放。',
      previewCamera: 'AR 需要允许相机和方向访问。请在 Safari 或 Chrome 中打开 HTTPS 网页。相机画面和位置只在本机使用，不录制、不上传。方向和相机视角为近似值，适合辅助寻星。',
      browserLocation: '定位未成功，可以直接填写经纬度。', locating: '正在定位…',
      sensorWaiting: '正在等待方向信息…', sensorTilt: '先将手机稍微放平，再举起对准天空',
      sensorDenied: '未获准访问方向。请在浏览器的网站设置中允许后重试。', sensorUnavailable: '未收到可用方向信息。可以拖动星图；手机请用 Safari 或 Chrome 打开。',
      sensorInsecure: '手机相机和随动需要 HTTPS 地址，请打开正式网页。', sensorCalibrate: '需要设置方向基准：将手机背面朝向正北，再点下方按钮。',
      trackingReady: '随动已开启 · 手机背面朝向天空', directionSetup: '方向校准', northLabel: '手机背面已朝正北', northNote: '无指南针数据时，借助已知方位或系统指南针找到正北，再让后置相机朝向它。',
      northDone: '已设置正北方向', calibrationFailed: '请先开启随动，稍微转动手机，等待方向信息。',
      targetCalibrate: '已对准所选天体，校准', targetCalibrateNote: '只有你已在真实天空中认出并对准该天体时才使用。',
      cameraStarting: '正在开启相机…', cameraUnavailable: '相机未能开启。请允许相机访问；也可继续用星图寻星。',
      cameraReady: '实景已开启 · 等待随动后跟着箭头找星', arWaiting: '方向未就绪 · 请打开设置完成校准', paused: '相机和随动已暂停，点击按钮可重新开启。',
      install: '添加到主屏幕', installNote: '像 App 一样打开，首次加载后可离线看星图', installTitle: '把追星人留在主屏幕',
      installIOS: 'iPhone / iPad：用 Safari 打开本站，点击分享，选择“添加到主屏幕”；若出现“作为网页 App 打开”，保持开启。',
      installAndroid: 'Android：用 Chrome 打开本站，在浏览器菜单中选择“安装应用”或“添加到主屏幕”。',
      installOffline: '离线资源准备好后，星表、搜索和计算无需网络。浏览器可能清理缓存；定位仍取决于设备。',
      installNow: '安装追星人', offlineReady: '离线星图已就绪', offlinePreparing: '正在准备离线星图…', offlineUnavailable: '离线缓存暂不可用，可继续在线使用',
      offlineActive: '当前离线 · 星图可用', updateReady: '发现新版本，点此更新', updateBusy: '请先返回星图再更新',
      webHelp3: '箭头由红变绿表示目标进入视场。中心 1° 内保持片刻，屏幕会闪动并播放音效。支持的 Android 设备还会震动；iPhone 保留画面和声音提示。',
      help5: '方向偏了？远离磁性手机壳和金属物，轻轻画“8”字后重新开启随动，或在设置中用已知天体校准。',
      dataSources: '星表来源与许可证', audioError: '请检查静音和音量；点击任意按钮后再试。', version: '网页版 · Astertrail 1.0'
    },
    en: {
      previewHint: 'Drag to explore · Switch to live AR', previewHelp: 'Drag or pinch the sky map. On desktop, use your mouse or arrow keys. In live AR, turn your phone; dragging and zooming are disabled.',
      previewCamera: 'AR needs camera and orientation permission. Open the HTTPS website in Safari or Chrome. Camera frames and location stay on your device; nothing is recorded or uploaded. Direction and camera field of view are approximate.',
      browserLocation: 'Location unavailable. You can enter coordinates instead.', locating: 'Finding your location…',
      sensorWaiting: 'Waiting for orientation…', sensorTilt: 'Hold your phone nearly flat, then point its back at the sky.',
      sensorDenied: 'Orientation access was denied. Allow it in your browser website settings, then try again.', sensorUnavailable: 'No usable orientation data. Drag the sky map, or open it on your phone in Safari or Chrome.',
      sensorInsecure: 'Camera and tracking need HTTPS. Open the hosted website on your phone.', sensorCalibrate: 'Set a direction reference: point the rear camera north, then tap the button below.',
      trackingReady: 'Tracking on · Point the back of your phone at the sky', directionSetup: 'Calibrate direction', northLabel: 'Rear camera is pointing north', northNote: 'If compass data is unavailable, use a known direction or the system compass to find north, then point the rear camera toward it.',
      northDone: 'North reference set', calibrationFailed: 'Enable Follow phone and move your phone slightly to receive orientation data.',
      targetCalibrate: 'Aligned with target — calibrate', targetCalibrateNote: 'Only use this when you have identified the selected object in the real sky and centered it.',
      cameraStarting: 'Starting camera…', cameraUnavailable: 'Camera could not start. Allow camera access or continue with the sky map.',
      cameraReady: 'Camera ready · Enable tracking to follow the arrow', arWaiting: 'Direction not ready · Open Settings to calibrate', paused: 'Camera and tracking paused. Tap to start again.',
      install: 'Add to Home Screen', installNote: 'Open like an app, with an offline sky map after the first load', installTitle: 'Keep Astertrail on your Home Screen',
      installIOS: 'iPhone / iPad: open this site in Safari, tap Share, then Add to Home Screen. Keep Open as Web App enabled if shown.',
      installAndroid: 'Android: open this site in Chrome and choose Install app or Add to Home Screen from the browser menu.',
      installOffline: 'Once offline resources are ready, the catalog, search, and sky calculations need no network. Browsers may clear cached data; location availability depends on your device.',
      installNow: 'Install Astertrail', offlineReady: 'Offline sky map ready', offlinePreparing: 'Preparing offline sky map…', offlineUnavailable: 'Offline cache unavailable. Online mode still works.',
      offlineActive: 'Offline · Sky map available', updateReady: 'New version available — update', updateBusy: 'Return to the sky map before updating.',
      webHelp3: 'The arrow turns green when the target enters your view. Stay within 1° of the center for a moment for a screen effect and chime. Supported Android devices also vibrate; iPhone uses visual and audio cues.',
      help5: 'Direction feels off? Move away from magnetic cases and metal, gently move the phone in a figure eight, then restart tracking, or calibrate with a known object in Settings.',
      dataSources: 'Catalog sources & licenses', audioError: 'Check silent mode and volume. Tap a button and try again.', version: 'Web edition · Astertrail 1.0'
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
