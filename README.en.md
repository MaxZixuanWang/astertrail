# 追星人 · Astertrail for the Web

[中文](README.md) | **English**

A sky guide for your phone. Explore the star chart, then switch to rear-camera AR with one tap. No WeChat mini-program or app store is required.

**Use it online: [追星人 · Astertrail](https://maxzixuanwang.github.io/astertrail/)**

## Using it on your phone

1. Open the website's **HTTPS address** in Safari on iPhone or Chrome on Android.
2. Set your observing location: allow location access or enter latitude and longitude. An example location is never automatically treated as your actual location.
3. Open search to browse all 5,180 targets, or type a star name or a designation such as M31. Chinese names are sorted by pinyin; English names are sorted alphabetically. The list renders at most 60 rows at a time.
4. Tap “Start AR stargazing” and allow orientation and camera access. First hold the phone roughly flat, then point its back toward the sky.
5. Turn your phone to follow the arrow: red means outside the field of view, and green means inside. Hold the target within 1° of the center briefly for a visual and sound cue. Supported Android browsers also vibrate.

Slide the zoom control on the right up to magnify or down to widen the view. You can also enable phone tracking in Settings and stay in the star chart. Computers without orientation sensors still support dragging and mouse-wheel zoom; the phone star chart supports pinch-to-zoom.

## Home screen and offline use

- iPhone: Safari → Share → Add to Home Screen. If “Open as Web App” appears, leave it enabled.
- Android: Chrome menu → Install app / Add to Home screen. Settings also shows an install button when the browser supports an installation prompt.
- Once Settings shows that the offline sky chart is ready, the catalogs, search, calculations, portrait, and sound have been cached. Browsers may clear their caches; offline location availability depends on the device.
- When a new version is available, Settings shows an update button. The app will not suddenly reload while you use it; you can accept the update after returning to the star chart.

## Orientation and camera

- The app uses the rear camera and browser orientation sensors; it does not recognize stars in the camera image. At 1×, AR uses an approximate 70° vertical field of view and is intended to help you find a direction.
- A magnified chart keeps its zoom when entering AR, with matching digital zoom for the camera image and chart. AR stops at 1× when zooming out so it cannot show beyond the camera image. Returning to the chart restores its previous zoom. Digital zoom adds no camera detail, and the actual field of view still varies by device.
- Android prefers absolute orientation; iPhone uses its compass to establish a heading reference. This reference is approximately magnetic north. There is no magnetic-declination model, and 1° accuracy is not guaranteed.
- If absolute orientation is unavailable, the app asks you to calibrate: use a known direction or the system compass, point the rear camera due north, and confirm that the back of the phone faces north. Relative orientation is never silently treated as north.
- Once you have identified the selected object in the real sky, you can point at it and calibrate in Settings. Do not perform this calibration based only on the on-screen arrow.
- Moving the app to the background or leaving the page stops the camera, orientation listeners, sound, and rendering. Tap the button to restart when you return.
- If camera or orientation access is denied, you can still drag the star chart and re-enable access in the browser's website permission settings.
- iPhone browsers do not support web vibration, so visual and audio cues remain available. Silent mode, volume, and browser audio policies may affect sound playback.

## Privacy

Location and preferences are stored in your local browser and used for local calculations. Camera images are not recorded or uploaded. The app itself has no accounts, advertising, analytics, or application backend. The website's hosting service may still keep ordinary access logs. The device and browser determine how system location services obtain your position.

## Authors and data

Authors: Max (Zixuan) Wang and Yinan Liu.

Max (Zixuan) Wang is an undergraduate studying Electronic Information Engineering at BDIC and an astrophotography enthusiast. Co-author Yinan Liu provided assistance and support throughout the project.

Thanks to Mr. Wang Wenzhi of Beijing No. 8 High School for the original idea behind this project.

[Personal website](https://maxzixuanwang.github.io/) · [Feedback by email](mailto:maxzixuanwang@gmail.com)

For astronomical data authors, versions, modifications, and licenses, see [Data sources](DATA_SOURCES.en.md) and the [License guide](licenses/README.en.md). Keep these files when redistributing the data. The original mini-program source and ZIP remain on the author's computer and are not included in this website release.

The real phone camera, compass accuracy, permission flow, and sound still need to be checked on your phone; automated tests cannot replace a physical-device trial.

[Verification record and limitations](QA_REPORT.en.md)
