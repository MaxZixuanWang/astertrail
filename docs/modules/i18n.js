(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SkyI18n = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const zh = {
    appName: '追星人', chart: '星图', ar: '实景 AR', settings: '设置', about: '关于', done: '完成', close: '关闭',
    searchLabel: '搜索恒星或梅西耶天体', searchPlaceholder: '搜天狼星、M31、仙女座大星系', searchClose: '收起搜索',
    allTargets: '全部天体 · 拼音排序', matches: '搜索结果', target: '个天体', targets: '个天体', more: '继续浏览', end: '已显示全部天体',
    empty: '没有找到。试试中文名、英文名或 M1—M110。', zoomIn: '放大', zoomOut: '缩小', skyLabel: '实时星图与寻星箭头',
    view: '星图与寻星', tracking: '手机随动', trackingNote: '转动手机，星图随之移动', lines: '星座连线', linesNote: '显示八十八星座的轮廓',
    sound: '庆祝音效', soundNote: '对准目标时，播放提示音', location: '观测位置', language: '语言', general: '通用',
    help: '使用说明', helpNote: '寻星方法与方向校准', on: '已开启', off: '已关闭',
    copied: '已复制', copyFailed: '暂时无法复制，请长按文字复制',
    found: '✧ 找到啦 ✧', center: '已进入中心 1°', cancel: '取消', welcome: '举起手机，找到那颗星', welcomeSub: '选一个目标 · 跟着箭头 · 对准即庆祝',
    startAR: '◎ 开始 AR 寻星', returnChart: '◉ 返回星图', arHint: '手机背面朝向天空 · 跟随实景箭头', chartHint: '星图可拖动浏览 · 一键进入实景 AR',
    locationTitle: '你在哪里看星星？', locationCopy: '位置仅在本机用于计算天空方向。可以定位，也可以填写经纬度。', locate: '获取当前位置',
    latitude: '纬度（北纬为正，−90～90）', longitude: '经度（东经为正，−180～180）', saveLocation: '使用这个位置', locationClose: '完成',
    helpTitle: '把手机当作一扇星窗', help1: '1. 设置位置，搜索星名或梅西耶编号，选择想找的天体。',
    help2: '2. 点击「开始 AR 寻星」。先稍微放平手机，再把手机背面对向天空，跟随箭头移动。',
    help3: '3. 箭头由红色变绿表示目标已进入视场。对准中心 1° 内并停留片刻，就会抖动并播放提示音。',
    help4: '也可以返回星图并在设置中开启随动。地平线以下的目标暂时看不到，不会触发庆祝。',
    help5: '方向偏了？远离磁性手机壳和金属物，轻轻画“8”字后重新开启随动。', calibrate: '已对准目标，校准方向', helpClose: '完成',
    privacyTitle: '开启寻星所需权限', privacyCopy: '位置用于计算天空方向；AR 模式使用相机和方向传感器。画面仅在本机显示，不拍照或上传。', privacyLink: '查看隐私保护指引', privacyAgree: '同意并继续', privacyDecline: '暂时不授权',
    audioError: '音效未播放，可检查静音和音量设置', tilt: '稍微放平手机，再抬起朝向天空', updateWeChat: '请更新微信后打开星图',
    sensorError: '这台设备暂不支持随动，可以拖动浏览星图', sensorStart: '先稍微放平手机，再抬起朝向天空', sensorWait: '未收到完整方向信息，请稍微放平手机或重新开启随动',
    invalidLocation: '请填写有效的经纬度，北纬和东经为正数。', locationError: '定位未成功，请检查微信定位权限，或直接填写经纬度。', privacyError: '请先在小程序后台配置隐私保护指引',
    chooseFirst: '先选择一个想找的天体', cameraUnavailable: '相机暂不可用，可在微信设置中授权，或继续使用星图', cameraReady: '实景 AR 已开启 · 举起手机，跟随箭头', cameraError: '相机未能开启，已回到星图，可继续寻星',
    calibrated: '已用当前目标校准方向', calibrateError: '请先开启随动，并选择地平线以上的目标',
    below: '地平线以下', altitude: '高度', statusBelow: '地平线以下 · 当前不可见', statusFound: '已到达中心 1°以内', statusInside: '已进入视场 · 继续靠近准星', statusBehind: '目标在背后 · 跟随箭头转身', statusOutside: '目标在视场外 · 跟随红色箭头',
    directionBelow: '目标尚在地平线以下', directionFound: '保持这个方向', directionNear: '稳住手机，快找到了', right: '向右转', left: '向左转', lower: '放低手机', raise: '抬高手机', direction: '跟随箭头移动',
    sampleLocation: '北京 · 示例位置', manualLocation: '手动位置', currentLocation: '当前位置', directions: ['北','东北','东','东南','南','西南','西','西北']
  };
  const en = {
    appName: 'Astertrail', chart: 'Sky map', ar: 'Live AR', settings: 'Settings', about: 'About', done: 'Done', close: 'Close',
    searchLabel: 'Search stars or Messier objects', searchPlaceholder: 'Sirius, M31, Andromeda…', searchClose: 'Close search',
    allTargets: 'All objects · A–Z', matches: 'Search results', target: 'object', targets: 'objects', more: 'Show more', end: 'All objects shown',
    empty: 'No matches. Try a star name or M1–M110.', zoomIn: 'Zoom in', zoomOut: 'Zoom out', skyLabel: 'Live sky map and finding guide',
    view: 'Sky & finding', tracking: 'Follow phone', trackingNote: 'Move your phone to explore the sky', lines: 'Constellation lines', linesNote: 'Show the outlines of 88 constellations',
    sound: 'Celebration sound', soundNote: 'Play a chime when the target is centered', location: 'Observing location', language: 'Language', general: 'General',
    help: 'How to use', helpNote: 'Finding objects and calibrating direction', on: 'On', off: 'Off',
    copied: 'Copied', copyFailed: 'Unable to copy. Touch and hold the text to copy it.',
    found: '✧ Found it! ✧', center: 'Within 1° of center', cancel: 'Clear', welcome: 'Raise your phone. Find a star.', welcomeSub: 'Choose a target · Follow the arrow',
    startAR: '◎ Start AR stargazing', returnChart: '◉ Back to sky map', arHint: 'Point the back of your phone at the sky', chartHint: 'Drag to explore · Switch to live AR',
    locationTitle: 'Where are you stargazing?', locationCopy: 'Your location stays on this device to calculate sky directions. Use GPS or enter coordinates.', locate: 'Use current location',
    latitude: 'Latitude (north +, −90 to 90)', longitude: 'Longitude (east +, −180 to 180)', saveLocation: 'Use this location', locationClose: 'Done',
    helpTitle: 'A window to the stars', help1: '1. Set your location, search a star name or Messier number, and choose a target.',
    help2: '2. Tap “Start AR stargazing”. Hold your phone nearly flat, then point its back at the sky and follow the arrow.',
    help3: '3. The arrow turns from red to green when the target enters your view. Stay within 1° of the center for a moment to feel a vibration and hear a chime.',
    help4: 'You can also use the sky map with Follow phone enabled in Settings. Objects below the horizon are not visible and will not trigger a celebration.',
    help5: 'Direction feels off? Move away from magnetic cases and metal, gently move your phone in a figure eight, then enable Follow phone again.', calibrate: 'Aligned — calibrate direction', helpClose: 'Done',
    privacyTitle: 'Permissions for stargazing', privacyCopy: 'Location calculates sky directions. AR uses the camera and motion sensors. The camera view stays on your device; no photos are taken or uploaded.', privacyLink: 'View privacy notice', privacyAgree: 'Agree and continue', privacyDecline: 'Not now',
    audioError: 'Check your volume and silent mode to hear the chime.', tilt: 'Hold your phone nearly flat, then raise it toward the sky.', updateWeChat: 'Update WeChat to open the sky map.',
    sensorError: 'Motion tracking is unavailable. Drag the sky map to explore.', sensorStart: 'Hold your phone nearly flat, then raise it toward the sky.', sensorWait: 'Waiting for direction data. Hold your phone nearly flat or restart Follow phone.',
    invalidLocation: 'Enter valid coordinates. North and east are positive.', locationError: 'Location unavailable. Check WeChat permissions or enter coordinates.', privacyError: 'Configure the privacy notice in the mini-program console first.',
    chooseFirst: 'Choose an object to find first.', cameraUnavailable: 'Camera unavailable. Allow access in WeChat settings or use the sky map.', cameraReady: 'Live AR is ready. Raise your phone and follow the arrow.', cameraError: 'Camera unavailable. You can keep exploring the sky map.',
    calibrated: 'Direction calibrated to your target.', calibrateError: 'Enable Follow phone and choose a target above the horizon first.',
    below: 'Below horizon', altitude: 'Altitude', statusBelow: 'Below horizon · Not visible now', statusFound: 'Within 1° of center', statusInside: 'In view · Move toward the crosshair', statusBehind: 'Behind you · Follow the arrow', statusOutside: 'Outside view · Follow the red arrow',
    directionBelow: 'The target is below the horizon', directionFound: 'Hold this direction', directionNear: 'Hold steady. Almost there.', right: 'Turn right', left: 'Turn left', lower: 'Lower your phone', raise: 'Raise your phone', direction: 'Follow the arrow',
    sampleLocation: 'Beijing · Example location', manualLocation: 'Manual location', currentLocation: 'Current location', directions: ['N','NE','E','SE','S','SW','W','NW']
  };
  const about = {
    name: 'Max (Zixuan) Wang', homepage: 'https://maxzixuanwang.github.io/', email: 'maxzixuanwang@gmail.com',
    sections: [
      {
        language: 'zh-CN', label: '中文',
        bio: '我是 Max（Zixuan）Wang，目前是 BDIC 电子信息工程专业的本科生，也是一名天文摄影爱好者。',
        story: '追星人源于北京八中王文智老师的一个想法。他曾是我的高中天文课老师，觉得现有工具不够顺手，希望做一个更简单、好用的寻星助手。感谢王老师的启发，让项目有了最初的方向。共同作者 Liu Yinan 在项目过程中提供了辅助与支持，在此一并致谢。',
        homepageLabel: '个人主页', emailLabel: '联系邮箱', copyHint: '点击复制',
        feedback: '如果遇到 bug，或有任何使用建议，欢迎通过邮箱告诉我。谢谢你帮助追星人变得更好。',
        title: '让每一次抬头，都有发现',
        wish: '从一颗熟悉的星星开始，慢慢认识头顶的宇宙。愿追星人陪你找到想看的天体，也留住抬头时的那份惊喜。'
      },
      {
        language: 'en', label: 'English',
        bio: 'I’m Max (Zixuan) Wang, an undergraduate in Electronic Information Engineering at BDIC and an astrophotography enthusiast.',
        story: 'Astertrail began with an idea from Wang Wenzhi, my astronomy teacher at Beijing No. 8 High School. He found existing tools awkward to use and wanted a simpler, more intuitive stargazing assistant. My thanks to Mr. Wang for the inspiration that started this project, and to co-author Liu Yinan for her assistance and support throughout.',
        homepageLabel: 'Personal website', emailLabel: 'Contact', copyHint: 'Tap to copy',
        feedback: 'Found a bug or have a suggestion? Please let me know by email. Thank you for helping make Astertrail better.',
        title: 'Look up. Find something new.',
        wish: 'Start with a familiar star and get to know the universe above you. May Astertrail help you find your way through the sky, and keep the wonder of looking up.'
      }
    ]
  };
  return { strings: { zh, en }, about, text(language, key) { return (language === 'en' ? en : zh)[key]; } };
});
