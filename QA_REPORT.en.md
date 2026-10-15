# 追星人 · Astertrail Web Verification Record

[中文](QA_REPORT.md) | **English**

Verification date: 2026-10-15.

## Verified

- **100/100 Node automated checks passed**, covering astronomical coordinates, orientation transforms, arrow projection, search/sorting, celebration conditions, browser orientation permissions, camera lifecycle, background cleanup, static packaging, offline caching, and updates.
- The complete 5,180-target catalog is accessible through paging. Chinese and English sorting is reproducible, and environments without Intl remain supported.
- Simulated camera tests cover denial, cancellation, late permission grants, playback failure, ended streams, and moving to the background. Old requests cannot restart or close a newer session. The camera requests video only, not microphone access.
- Main-flow tests confirm that waiting for orientation is not treated as valid tracking and AR cannot trigger a celebration without actual orientation data. Entering AR preserves chart magnification and matches video scaling to the perspective projection; returning restores the prior chart zoom. Zoom and pan are blocked while the camera starts, mode changes clear unfinished touches, and denied or cancelled camera requests preserve chart zoom.
- AR composites camera frames and the star chart in one opaque canvas, independent of the native video layer's display size. Regression checks cover 12 combinations of portrait/landscape video, portrait/landscape viewport and 1/2/3× zoom, plus unready frames, zero dimensions, drawing order, the 1× AR minimum and restored chart zoom on return.
- A separate browser test deliberately shrank the underlying video element to 56% of the viewport. The moving TEST CAMERA image in the final canvas still filled the screen; zooming, landscape mode and return to the chart passed without page errors. This simulates a layout fault, not the iPhone's native video issue. Actual iPhone behavior still needs the user's retest.
- Simulated PWA tests confirm offline opening at both a site root and a subdirectory. External, login/API, and write requests are not intercepted. Updates activate only after explicit acceptance or after all old pages close.
- Settings displays the release number and build identifier. A standalone bilingual update page bypasses the offline cache; tests cover pending installation, navigation after activation, scope isolation, network retry and late results after timeout.
- The local website was opened in Codex's built-in browser. The chart, M31 search results, target selection, Settings, language switching, and installation instructions worked. Settings showed that the offline chart was ready. The waiting-update button and reload after accepting it were also exercised.
- At viewport sizes 320×740, 375×812, and 812×375, there was no horizontal overflow and the main button remained inside the viewport. A screenshot of the 375×812 home screen was saved and inspected.
- Browser checks exercised the vertical slider, up/down keys, and zoom limits. A separate test page streamed a moving grid marked TEST CAMERA into the video element to verify matching zoom on AR entry, adjustment within AR, and restored chart zoom on return. No physical camera was used.
- The standalone web app retains the original bilingual introduction, personal website, email, portrait, and data attribution.

## Verification limits

- Browser API tests use controlled simulated camera and orientation data. **They do not establish that physical phone hardware has been verified.** Actual camera direction, magnetic interference, iOS permission prompts, orientation in landscape mode, and sound still require the user's phone testing.
- The built-in browser confirmed cache installation and updates. Offline startup was verified by service-worker tests, but has not yet been checked on a physical phone in airplane mode.
- iPhone web apps do not support physical vibration and use visual/audio cues instead. Android calls the vibration API where supported.
- Sensitive browser APIs are enabled only on HTTPS or a secure local development origin. A computer's 127.0.0.1 address is not a URL that a phone can reach.
- If hosting requires login, anonymous cache requests may be blocked and the app reports that offline use is unavailable. Public static hosting does not depend on login.

## Original project and tool cleanup

The original WeChat mini-program source and ZIP are retained in full. Both portable WeChat DevTools versions, their installers, and their dedicated caches were cleaned up using explicitly identified paths. The actual WeChat application was not removed. Cleanup details are retained in the working-directory records.
