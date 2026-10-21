# Preloader investigation: low-end Windows PCs

Investigated October 21, 2026 against the local working tree. Application behavior was not changed. Existing application edits were left intact. Tests ran on macOS with headless Chromium; no affected Windows machine or production session was available, so these findings establish reproducible failure paths rather than a confirmed diagnosis of that particular PC.

## Findings

### 1. Confirmed: progress depends on frame rate and can lose a race with the failsafe

In `app/javascript/controllers/preloader_controller.js:51`, progress moves 12% of the remaining distance **per animation frame**. `MAX_MS = 3200` changes the target to 100; it does not force completion at 3.2 seconds. A slow frame rate therefore extends the counter's approach to 100. The exit watchdog is only installed in `leave()`, after progress actually completes.

Meanwhile, `app/views/layouts/application.html.erb:27` removes `is-preloading` nine seconds after the head script runs. This hides the overlay but does not call the controller's `complete()`, stop the effect, dispatch `preloader:reveal`, or record session completion. The bootstrap and controller use different starting times.

Reproduction: limiting animation callbacks to 5 FPS, with WebGL disabled to isolate the counter, left the count at **99% when the nine-second failsafe hid the loader**. The controller started its wipe around 10.17 seconds and dispatched the reveal around 11.08 seconds. The apparent sudden disappearance is a real timing defect.

Delaying the preloader module response by eight seconds reproduced the same race: the overlay was hidden around 9.20 seconds at **28%**, and the hero reveal arrived around 11.30 seconds. Slow JavaScript delivery or initialization can therefore break the sequence even without a permanently failed download.

### 2. Likely performance contributor: expensive graphics run whenever WebGL initializes

`app/javascript/effects/paper_burn.js:117` accepts any successful WebGL context. It does not request `failIfMajorPerformanceCaveat`, assess initial frame performance, or reduce quality on a struggling renderer. WebGL availability alone does not establish that this effect will run smoothly.

The effect renders a full-screen fragment shader with several six-octave procedural noise calculations, plus a separate animated 2D canvas for smoke and sparks. Backing dimensions use a device-pixel ratio of up to 1.5, without a total pixel budget. At 1920 × 1080 and DPR 1.5, each full-size surface has about 4.67 million pixels; a single RGBA surface is approximately 18.7 MB before other buffers and textures. This is an allocation-size estimate, not a memory measurement.

The local browser reported **SwiftShader software rendering**, demonstrating that this code accepts a software renderer. The full sequence took about 5.7 seconds from activation normally and 7.6 seconds with 6× CPU throttling. These are single-run diagnostic measurements, not hardware benchmarks. CPU throttling does not reproduce a specific Windows GPU or driver.

The [WebGL specification](https://registry.khronos.org/webgl/specs/latest/1.0/) explains that implementations can use software rendering and that `failIfMajorPerformanceCaveat` can reject contexts whose performance would be dramatically lower. That option is a useful first filter, but actual frame performance still needs a fallback.

### 3. Confirmed: context loss does not activate the fallback

The controller handles an unavailable context or an initialization exception by using the CSS wipe. That path worked when `getContext("webgl")` was forced to return null: the overlay was removed around 4.69 seconds after navigation.

However, there is no `webglcontextlost` handler. Forcing loss with `WEBGL_lose_context` after ignition did **not** activate the wipe. The JavaScript counter and lifecycle continued, and the overlay was eventually removed, but the fire rendering had no recovery path. This explains a missing or broken fire effect; this test did not reproduce a permanently stuck page.

The [Khronos context-loss extension specification](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/) documents the mechanism used for this experiment.

### 4. A loader that never appears can also be intentional

The head script skips it if `sessionStorage.preloaded` is present or the browser reports `prefers-reduced-motion: reduce`. Storage access errors also skip it. These conditions need checking on the affected PC before treating total absence as a graphics failure.

## Validation

All four existing tests in `test/browser/preloader.spec.js` passed:

```sh
PATH=/opt/homebrew/opt/ruby@3.4/bin:$PATH npm run test:browser -- test/browser/preloader.spec.js
```

Additional local fault-injection probes used a 1366 × 768 viewport and a fresh browser context per scenario:

| Scenario | Observed result |
| --- | --- |
| Baseline, software WebGL | Count reached 100; removed around 6.07 s after navigation |
| WebGL unavailable | CSS wipe activated; removed around 4.69 s |
| 6× CPU throttle | Count reached 100; removed around 7.76 s |
| 5 FPS, WebGL unavailable | Head failsafe hid the overlay at 99%; reveal arrived later |
| WebGL context lost after ignition | No CSS wipe; lifecycle eventually completed |
| Preloader module delayed 8 s | Head failsafe hid the overlay at 28%; reveal arrived later |

No uncaught page errors were reported in those six probes. The diagnostic runner and raw JSON are retained locally under ignored `tmp/preloader-investigation/`.

The existing suite does not cover throttled animation frames, context loss, or delayed controller startup. Its slow-image test intercepts filename extensions such as `.webp`, but uploaded portrait images use extensionless `/media/:id?v=…` URLs. It therefore does not reliably delay the actual hero portrait. Future network checks should intercept `/media/` requests explicitly.

## Recommended repair order

1. Make progress easing depend on elapsed time and make the loading deadline force completion, independently of frame count.
2. Route all timeout exits through one idempotent cleanup and reveal operation. Keep a head-level escape for failed module loading, but synchronize it with the controller's lifecycle.
3. Use the CSS wipe when context creation has a major performance caveat, frame performance is poor, or a context is lost. Stop the expensive rendering before switching.
4. Cap the burn's total rendering pixels and offer a cheaper shader/particle setting for weaker hardware.
5. Add regression coverage for the reproduced timing failures, context loss, delayed JavaScript, and the real media URL pattern.

To identify which path affects the reported Windows PC, the remaining evidence is its exact symptom, browser/version, reduced-motion setting, and graphics renderer/hardware acceleration status. No production changes or deployment were performed.

## Repairs applied

The subsequent implementation replaces frame-count easing with elapsed-time easing and enforces the 3.2-second loading deadline using a separate timer measured from the head bootstrap. Late controller startup completes immediately. The head failsafe now requests controller cleanup, with its own reveal, removal, and session completion when the controller never loads. A controller arriving after that cleanup cannot replay the reveal.

The burn rejects contexts with a major performance caveat, caps its backing surfaces at one million pixels, and stops rendering when its context is lost or four consecutive frames exceed 50 ms after startup. It releases the canvases and graphics resources before falling back to the CSS wipe. If the hero was already revealed, it completes directly to avoid covering the page again.

Regression checks now cover low or missing animation frames, slow or missing controller delivery, controller arrival after the failsafe, context loss during loading and exit, slow graphics, the rendering pixel budget, and actual `/media/` requests.

Post-change validation: the full Chromium browser suite passed 31 of 32 checks. The 5 FPS test reported a timeout with an approximately 15-minute execution gap; an immediate isolated rerun passed in 5.2 seconds (8.8 seconds including startup). All 32 checks therefore passed across those runs, including the accessibility, navigation, publishing, and new preloader cases. Validation remains on macOS Chromium rather than the affected Windows hardware.
