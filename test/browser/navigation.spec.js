const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => sessionStorage.setItem("preloaded", "1"));
});

test("slow navigation shows feedback, animates content, and leaves history usable", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/about");
  await page.evaluate(() => {
    window.navigationAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.id === "main-content") window.navigationAnimations.push(args);
      return animate.apply(this, args);
    };
  });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route("**/experience", async route => {
    await held;
    await route.continue();
  });
  await page.locator(".nav-list").getByRole("link", { name: "Experience", exact: true }).click();
  await expect(page.locator("#navigation-loader")).toBeVisible();
  await expect(page.locator(".navigation-loader-copy")).toHaveText("Loading Experience…");
  await expect(page.locator("#main-content")).toHaveAttribute("aria-busy", "true");
  await page.screenshot({ path: "test-results/navigation-loading-desktop.png" });
  release();
  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.locator("#navigation-loader")).toBeHidden();
  await expect(page.locator("#main-content")).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.navigationAnimations.length)).toBe(2);
  await expect(page.locator("#main-content")).toHaveCSS("opacity", "1");
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("#main-content")).toHaveCSS("opacity", "1");
  await expect(page.locator("#main-content")).not.toHaveAttribute("aria-busy");
  await page.goForward();
  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.locator("#navigation-loader")).toHaveCount(1);
  await expect(page.locator("#navigation-loader")).toBeHidden();
  expect(errors).toEqual([]);
});

test("mobile navigation closes its drawer and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.locator(".nav-list").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("body")).not.toHaveClass(/navigation-open/);
  await expect(page.locator("#main-content")).toBeFocused();
  expect(await page.locator("#main-content").evaluate(element => element.getAnimations().length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("failed navigation clears loading feedback and permits a retry", async ({ page }) => {
  await page.goto("/about");
  // Keep Turbo's normal full-page fallback inside the test so we can inspect cleanup.
  await page.evaluate(() => document.addEventListener("turbo:fetch-request-error", event => event.preventDefault()));
  await page.route("**/contact", route => route.abort("failed"));
  await page.locator(".nav-list").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page.locator("#main-content")).not.toHaveAttribute("aria-busy");
  await expect(page.locator("#navigation-loader")).toBeHidden();
  await page.unroute("**/contact");
  await page.locator(".nav-list").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("#main-content")).toHaveCSS("opacity", "1");
});

test("chapter anchors keep scrolling without page loading feedback", async ({ page }) => {
  await page.goto("/projects/veloce");
  await page.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.locator("#main-content")).not.toHaveAttribute("aria-busy");
  await expect(page.locator("#navigation-loader")).toBeHidden();
});

for (const width of [375, 1440]) {
  test(`home transitions keep a dark backdrop at ${width}px, including browser Back`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    async function navigate(name) {
      if (width < 1024) await page.getByRole("button", { name: "Open navigation" }).click();
      await page.locator(".nav-list").getByRole("link", { name, exact: true }).click();
      await expect(page.locator("html")).not.toHaveAttribute("aria-busy");
    }

    await navigate("Projects");
    await page.evaluate(() => {
      window.homeTransitionFrames = [];
      const sample = () => {
        if (document.body.classList.contains("home")) {
          window.homeTransitionFrames.push({
            background: getComputedStyle(document.body).backgroundColor,
            opacity: Number(getComputedStyle(document.getElementById("main-content")).opacity),
          });
        }
        window.homeSample = requestAnimationFrame(sample);
      };
      sample();
    });

    await navigate("Overview");
    await expect(page.locator("body")).toHaveClass("home");
    await expect(page.locator("#main-content")).toHaveCSS("opacity", "1");
    await page.goBack();
    await expect(page.locator("body")).not.toHaveClass("home");
    await expect(page.locator("html")).not.toHaveAttribute("aria-busy");
    await page.evaluate(() => { window.homeTransitionFrames = []; });
    await page.goBack();
    await expect(page.locator("body")).toHaveClass("home");
    await expect(page.locator("#main-content")).toHaveCSS("opacity", "1");
    const frames = await page.evaluate(() => {
      cancelAnimationFrame(window.homeSample);
      return window.homeTransitionFrames;
    });
    expect(frames.some(frame => frame.opacity < 0.9)).toBe(true);
    expect([...new Set(frames.map(frame => frame.background))]).toEqual(["rgb(14, 10, 8)"]);
    await expect(page.locator(".paper").first()).toHaveCSS("background-color", "rgb(245, 240, 234)");
  });
}
