const { test, expect } = require("@playwright/test");

test("first visit counts to 100, burns away, and stays gone for the session", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 375, height: 812 });
  await allowSoftwareWebGL(page);
  await page.goto("/");
  const preloader = page.locator(".preloader");
  await expect(preloader).toBeVisible();
  await expect(preloader).toHaveClass(/is-burning/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const counts = [];
  await expect.poll(async () => {
    const text = await page.evaluate(() => document.querySelector('[data-preloader-target="count"]')?.dataset.value ?? "100");
    counts.push(Number(text));
    return Number(text);
  }, { timeout: 6000, intervals: [50] }).toBe(100);
  expect(counts).toEqual([...counts].sort((a, b) => a - b));
  await expect(preloader).toHaveCount(0, { timeout: 8000 });
  await expect(page.locator("html")).not.toHaveClass(/is-preloading/);
  await expect(page.locator("#hero-name")).toHaveAccessibleName("Airl Joriz Janoplo");
  await expect(page.locator(".hero-char")).not.toHaveCount(0);

  await page.getByRole("link", { name: "View my work" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator(".preloader")).toBeHidden();
  await page.reload();
  await expect(page.locator(".preloader")).toBeHidden();
  expect(errors).toEqual([]);
});

test("slow media keeps the entrance visible until the hero can appear", async ({ page }) => {
  let mediaRequests = 0;
  await page.route(/\/media\//, async (route) => {
    mediaRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await route.continue().catch(() => {});
  });
  const started = Date.now();
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 12000 });
  expect(Date.now() - started).toBeLessThan(11000);
  expect(mediaRequests).toBeGreaterThan(0);
});

test("OS animations off still plays the preloader and hero entrance", async ({ page }) => {
  await observeLifecycle(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".preloader")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-preloader-target="count"]')?.dataset.value)).not.toBe("0");
  await expect.poll(() => page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  await expectCompleted(page);
  await expect(page.locator(".hero-char")).not.toHaveCount(0);
});

test("without JavaScript the preloader never covers content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3101/");
  await expect(page.locator(".preloader")).toBeHidden();
  await expect(page.locator("#hero-name")).toBeVisible();
  await context.close();
});

// Observe the lifecycle of the inline entrance independently of the main application.
async function observeLifecycle(page) {
  await page.addInitScript(() => {
    window.loaderEvents = [];
    for (const type of ["preloader:reveal", "preloader:complete"]) {
      document.addEventListener(type, () => window.loaderEvents.push(type));
    }
  });
}

async function expectCompleted(page, timeout = 8000) {
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout });
  await expect(page.locator("html")).not.toHaveClass(/is-preloading/);
  expect(await page.evaluate(() => sessionStorage.getItem("preloaded"))).toBe("1");
  expect(await page.evaluate(() => window.loaderEvents)).toEqual(["preloader:reveal", "preloader:complete"]);
}

test("5 FPS still reaches 100 and finishes on time", async ({ page }) => {
  await observeLifecycle(page);
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 200);
    window.cancelAnimationFrame = id => clearTimeout(id);
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind === "webgl" ? null : original.call(this, kind, ...args);
    };
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-preloader-target="count"]')).toHaveAttribute("data-value", "100", { timeout: 4000 });
  await expectCompleted(page, 4500);
});

test("the deadline works even when animation frames never fire", async ({ page }) => {
  await observeLifecycle(page);
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-preloader-target="count"]')).toHaveAttribute("data-value", "100", { timeout: 4000 });
  await expectCompleted(page, 4500);
});

async function allowSoftwareWebGL(page) {
  // Exercise the actual renderer in headless environments despite the performance-caveat filter.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, options) {
      return original.call(this, kind, kind === "webgl" ? { ...options, failIfMajorPerformanceCaveat: false } : options);
    };
  });
}

test("losing WebGL during loading removes the canvases and uses the wipe", async ({ page }) => {
  await observeLifecycle(page);
  await allowSoftwareWebGL(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader")).toHaveClass(/is-burning/);
  await page.evaluate(() => {
    document.querySelector("canvas.paper-burn").getContext("webgl").getExtension("WEBGL_lose_context").loseContext();
  });
  await expect(page.locator("canvas.paper-burn")).toHaveCount(0);
  await expect(page.locator(".preloader")).not.toHaveClass(/is-burning/);
  await expect(page.locator(".preloader")).toHaveClass(/is-wiping/, { timeout: 4000 });
  await expectCompleted(page);
});

test("slow graphics fall back and rendering stays within its pixel budget", async ({ page }) => {
  await observeLifecycle(page);
  await allowSoftwareWebGL(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 100);
    window.cancelAnimationFrame = id => clearTimeout(id);
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader")).toHaveClass(/is-burning/);
  const pixels = await page.locator("canvas.paper-burn").first().evaluate(canvas => canvas.width * canvas.height);
  expect(pixels).toBeLessThanOrEqual(1_000_000);
  await expect(page.locator("canvas.paper-burn")).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator(".preloader")).not.toHaveClass(/is-burning/);
  await expectCompleted(page);
});


test("context loss during the final burn still completes exactly once", async ({ page }) => {
  await observeLifecycle(page);
  await allowSoftwareWebGL(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader")).toHaveClass(/is-burning/);
  await expect(page.locator(".preloader")).toHaveClass(/is-leaving/, { timeout: 4000 });
  await page.evaluate(() => {
    document.querySelector("canvas.paper-burn").getContext("webgl").getExtension("WEBGL_lose_context").loseContext();
  });
  await expectCompleted(page);
});


test("a fresh first visit burns even with every external JavaScript request blocked", async ({ page }) => {
  await observeLifecycle(page);
  await allowSoftwareWebGL(page);
  await page.route(/\/assets\/.*\.js(?:\?.*)?$/, route => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader")).toBeVisible();
  await expect(page.locator(".preloader")).toHaveClass(/is-burning/);
  await expect(page.locator(".preloader")).not.toHaveClass(/is-wiping/);
  await expect.poll(() => page.evaluate(() => Number(document.querySelector('[data-preloader-target="count"]')?.dataset.value))).toBeGreaterThan(0);
  await expect.poll(() => page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  await expectCompleted(page);
});

test("the preloader animates before stylesheets arrive and waits to reveal the styled hero", async ({ page }) => {
  await observeLifecycle(page);
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route(/\/assets\/.*\.css(?:\?.*)?$/, async route => {
    await held;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(".preloader")).toBeVisible();
  await expect(page.locator(".preloader")).toHaveCSS("background-color", "rgb(245, 240, 234)");
  await expect(page.locator("html")).toHaveClass(/is-style-loading/);
  await expect(page.locator('[data-preloader-target="count"]')).toHaveAttribute("data-value", "99", { timeout: 5000 });
  await expect(page.locator(".preloader")).toBeVisible();
  await page.screenshot({ path: "test-results/entrance-before-styles.png" });
  release();
  await expect.poll(() => page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  await expectCompleted(page);
});

test("blocked session storage does not skip the entrance", async ({ page }) => {
  await observeLifecycle(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("Storage blocked", "SecurityError"); } });
  });
  await page.goto("/");
  await expect(page.locator(".preloader")).toBeVisible();
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 8000 });
  expect(await page.evaluate(() => window.loaderEvents)).toEqual(["preloader:reveal", "preloader:complete"]);
});


test("a throttled low-end device keeps the entrance with cheaper hero effects", async ({ page }) => {
  await observeLifecycle(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 2 });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".preloader")).toBeVisible();
  await expect.poll(() => page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  const filters = await page.locator(".hero-char").first().evaluate(element =>
    element.getAnimations().flatMap(animation => animation.effect.getKeyframes().map(frame => frame.filter)));
  expect(filters.every(filter => filter === "none")).toBe(true);
  await expectCompleted(page);
  await cdp.detach();
});


test("a cold-cache portrait finishing after 99 percent still starts the burn", async ({ page }) => {
  await observeLifecycle(page);
  await allowSoftwareWebGL(page);
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route(/\/media\//, async route => {
    await held;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(".preloader")).toBeVisible();
  await expect(page.locator('[data-preloader-target="count"]')).toHaveAttribute("data-value", "99", { timeout: 5000 });
  expect(await page.evaluate(() => window.loaderEvents)).toEqual([]);
  expect(await page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBe(0);
  release();
  await expect(page.locator(".preloader")).toHaveClass(/is-burning/);
  await expect(page.locator(".preloader")).not.toHaveClass(/is-wiping/);
  await expect.poll(() => page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  expect(await page.locator(".hero-portrait").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expectCompleted(page);
});


test("a failed portrait still releases the loader and plays the hero", async ({ page }) => {
  await observeLifecycle(page);
  await page.route(/\/media\//, route => route.abort());
  await page.goto("/");
  await expect(page.locator(".preloader")).toBeVisible();
  await expect.poll(() => page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  await expectCompleted(page);
});

test("navigating home waits for that visit's portrait before playing the entrance", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("preloaded", "1"));
  await page.goto("/about");
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route(/\/media\//, async route => {
    await held;
    await route.continue();
  });
  await page.locator(".nav-list").getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".hero-char")).not.toHaveCount(0);
  expect(await page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBe(0);
  release();
  await expect.poll(() => page.locator(".hero-char").first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  expect(await page.locator(".hero-portrait").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
});
