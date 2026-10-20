const { test, expect } = require("@playwright/test");

test("first visit counts to 100, burns away, and stays gone for the session", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const preloader = page.locator(".preloader");
  await expect(preloader).toBeVisible();
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

test("the preloader is capped on a slow network", async ({ page }) => {
  await page.route(/\.(png|jpe?g|webp)(\?|$)/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await route.continue().catch(() => {});
  });
  const started = Date.now();
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 12000 });
  expect(Date.now() - started).toBeLessThan(11000);
});

test("reduced motion skips the preloader", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/is-preloading/);
  await expect(page.locator(".preloader")).toBeHidden();
});

test("without JavaScript the preloader never covers content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3101/");
  await expect(page.locator(".preloader")).toBeHidden();
  await expect(page.locator("#hero-name")).toBeVisible();
  await context.close();
});
