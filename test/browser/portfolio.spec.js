const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const path = require("path");

test("public pages stay accessible and within the viewport at four sizes", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  const issues = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/projects",
      "/projects/sentisphere",
      "/about",
      "/experience",
      "/contact",
    ]) {
      const response = await page.goto(route);
      expect(response.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      issues.push(
        ...accessibility.violations.map((v) => ({
          width,
          route,
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      );
    }
    await page.goto("/");
    await page.locator(".hero-portrait").evaluate((image) => image.decode());
    if (width === 375) {
      const intro = await page.locator(".hero-intro").boundingBox();
      const cta = await page.locator(".hero-cta").boundingBox();
      const marquee = await page.locator(".marquee").boundingBox();
      expect(cta.y).toBeGreaterThanOrEqual(intro.y + intro.height);
      expect(marquee.y).toBeGreaterThanOrEqual(cta.y + cta.height);
    }
    await page.screenshot({
      path: `test-results/overview-${width}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
  expect(issues).toEqual([]);
});

test("mobile navigation traps focus, closes with Escape, and supports Turbo navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: "Close navigation", exact: true }).last(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page
    .locator(".nav-list")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator("body")).not.toHaveClass(/navigation-open/);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      document.querySelector(".sidebar").contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
});

test("project filtering works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3101/projects");
  await page.getByLabel("Explore the stack").selectOption("Flutter");
  await page.getByRole("button", { name: "Filter projects" }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(page.locator(".project-card h3")).toHaveText("E-Lista");
  await context.close();
});

test("owner can create, preview, upload, publish, unpublish, and delete a project", async ({
  page,
  browser,
}) => {
  await page.goto("/session/new");
  await page.getByLabel("Email address").fill("browser-test@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: "Add a project +" }).click();
  const slug = `browser-project-${Date.now()}`;
  await page.getByLabel("Name", { exact: true }).fill("Browser QA project");
  await page.getByLabel("Slug", { exact: true }).fill(slug);
  await page
    .getByLabel("Tagline", { exact: true })
    .fill("A test of the complete publishing flow");
  await page.getByLabel("Role", { exact: true }).fill("Developer");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Browser suite content. Removed after verification.");
  await page.getByLabel("Technologies (comma separated)").fill("Ruby, Rails");
  await page
    .getByLabel("Gallery", { exact: true })
    .setInputFiles(path.join(__dirname, "../../db/content/portrait.png"));
  await page.getByRole("button", { name: "Save changes" }).click();
  await page
    .locator(".content-row")
    .filter({ hasText: "Browser QA project" })
    .getByRole("link", { name: "Edit", exact: true })
    .click();
  await page
    .getByLabel("Alternative text", { exact: true })
    .fill("An uploaded test portrait");
  await page.getByLabel("Image position", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  const editUrl = page.url();
  await page.getByRole("link", { name: "Preview ↗" }).click();
  await expect(
    page.getByText("Private preview", { exact: false }),
  ).toBeVisible();
  const image = page.locator(".case-gallery img");
  await expect(image).toHaveAttribute("alt", "An uploaded test portrait");
  await image.evaluate((element) => element.decode());
  const imageUrl = await image.getAttribute("src");
  const anonymous = await browser.newContext();
  const visitor = await anonymous.newPage();
  expect(
    (await visitor.goto(`http://127.0.0.1:3101/projects/${slug}`)).status(),
  ).toBe(404);
  expect(
    (await visitor.request.get(`http://127.0.0.1:3101${imageUrl}`)).status(),
  ).toBe(404);
  await page.goto(editUrl);
  await page.getByLabel("Published — visible to everyone").check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".flash.notice")).toBeVisible();
  expect(
    (await visitor.goto(`http://127.0.0.1:3101/projects/${slug}`)).status(),
  ).toBe(200);
  await expect(visitor.locator("h1")).toContainText("Browser QA project");
  await visitor
    .locator(".case-gallery img")
    .evaluate((element) => element.decode());
  await page.getByLabel("Published — visible to everyone").uncheck();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".flash.notice")).toBeVisible();
  expect(
    (await visitor.goto(`http://127.0.0.1:3101/projects/${slug}`)).status(),
  ).toBe(404);
  expect(
    (await visitor.request.get(`http://127.0.0.1:3101${imageUrl}`)).status(),
  ).toBe(404);
  await page.goto("/admin/projects");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator(".content-row")
    .filter({ hasText: "Browser QA project" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(
    page.getByText("Content deleted.", { exact: true }),
  ).toBeVisible();
  await anonymous.close();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/session\/new$/);
});

test("content studio is accessible on desktop and mobile", async ({ page }) => {
  await page.goto("/session/new");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByLabel("Email address").fill("browser-test@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/admin",
      "/admin/projects/new",
      "/admin/projects/sentisphere/edit",
      "/admin/profile",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${route} overflow`,
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
        `${width}px ${route}`,
      ).toEqual([]);
    }
  }
});
