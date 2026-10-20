const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

// The first-visit preloader has its own spec; everywhere else, start as a returning visitor.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => sessionStorage.setItem("preloaded", "1"));
});

async function revealAll(page) {
  // Turbo updates the URL before replacing the body; wait for the final render
  // before collecting elements while page transitions are running.
  await expect(page.locator('html')).not.toHaveAttribute('aria-busy');
  await expect(page.locator('html')).not.toHaveAttribute('data-turbo-preview');
  for (const item of await page.locator('[data-reveal-target="item"]').all()) {
    await item.scrollIntoViewIfNeeded();
  }
  await expect(page.locator('.reveal-pending')).toHaveCount(0);
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(animation => animation.effect.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => {}))));
}

test('filter feedback survives network failure and allows retry', async ({ page }) => {
  await page.goto('/projects');
  await page.locator('#technology').selectOption('Flutter');
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/projects?*', async route => {
    await held;
    await route.abort('failed');
  });
  await page.getByRole('button', { name: 'Filter projects' }).click();
  await expect(page.getByRole('button', { name: 'Filtering…' })).toBeDisabled();
  await expect(page.locator('.filter-bar')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.turbo-progress-bar')).toBeVisible();
  release();
  await expect(page.getByRole('status')).toHaveText('Couldn’t load projects. Try again.');
  await expect(page.getByRole('button', { name: 'Filter projects' })).toBeEnabled();
  await expect(page.locator('#technology')).toHaveValue('Flutter');
  await page.unroute('**/projects?*');
  await page.getByRole('button', { name: 'Filter projects' }).click();
  await expect(page).toHaveURL(/technology=Flutter/);
  await expect(page.locator('.project-card')).toHaveCount(1);
  await expect(page.locator('[data-loading-target="status"]')).toBeEmpty();
  await page.locator('#technology').selectOption('Laravel');
  await page.route('**/projects?*', route => route.fulfill({ status: 503, contentType: 'text/html', body: 'Temporarily unavailable' }));
  await page.getByRole('button', { name: 'Filter projects' }).click();
  await expect(page.getByRole('status')).toHaveText('Couldn’t load projects. Try again.');
  await expect(page.getByRole('button', { name: 'Filter projects' })).toBeEnabled();
  await expect(page.locator('#technology')).toHaveValue('Laravel');
  await expect(page.locator('.project-card')).toHaveCount(1);
  await page.unroute('**/projects?*');
  await page.goto('/projects?technology=NoSuchTechnology');
  await expect(page.getByRole('heading', { name: 'No projects with that technology yet.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filter projects' })).toBeEnabled();
});

test('image loading reserves space, settles, and handles a failed image', async ({ page }) => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/media/**', async route => {
    await held;
    await route.continue();
  });
  await page.goto('/projects', { waitUntil: 'domcontentloaded' });
  const art = page.locator('.project-card', { hasText: 'Veloce' }).locator('.project-art');
  await expect(art).toHaveAttribute('data-image-state', 'loading');
  await art.scrollIntoViewIfNeeded();
  const before = await art.evaluate(element => element.offsetHeight);
  release();
  await expect(art).toHaveAttribute('data-image-state', 'loaded');
  const after = await art.evaluate(element => element.offsetHeight);
  expect(after).toBe(before);
  await page.unroute('**/media/**');
  await page.route('**/media/**', route => route.abort('failed'));
  await page.reload();
  await expect(art).toHaveAttribute('data-image-state', 'error');
  await expect(art.getByText('Image unavailable')).toBeVisible();
  await expect(art.locator('img')).toBeHidden();
});

test('reveals support focus, fast scrolling, and Turbo restoration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const pendingCard = page.locator('.project-card.reveal-pending').first();
  await expect(pendingCard).toHaveCount(1);
  await pendingCard.locator('a').first().focus();
  await expect(page.locator('.project-card').first()).not.toHaveClass(/reveal-pending/);
  await revealAll(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.nav-list').getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await revealAll(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.reveal-pending')).toHaveCount(0);
  await page.locator('.nav-list').getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('button', { name: 'Filter projects' })).toBeEnabled();
});

test('Veloce chapters track both directions and remain accessible at every viewport', async ({ page }) => {
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/projects/veloce');
    const visual = page.locator('.story-visual');
    await expect(visual).toHaveCSS('position', width >= 1024 ? 'sticky' : 'static');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const links = page.locator('.story-chapters a');
    for (const index of [0, 1, 2, 3, 1, 0]) {
      await links.nth(index).click();
      // Native anchor scrolling may clamp near the document end. Wait for it
      // to settle, then compare the indicator with the actual activation line.
      await page.evaluate(() => new Promise(resolve => {
        let previous = scrollY, stable = 0;
        const check = () => {
          stable = Math.abs(scrollY - previous) < .5 ? stable + 1 : 0;
          previous = scrollY;
          if (stable >= 5) resolve();
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      }));
      const active = await page.locator('[data-story-target="chapter"]').evaluateAll(chapters => {
        const bar = document.querySelector('.topbar').getBoundingClientRect().height;
        let active = chapters[0];
        for (const chapter of chapters) if (chapter.getBoundingClientRect().top <= bar + (innerHeight - bar) * .35) active = chapter;
        return '#' + (active.dataset.act || active.id);
      });
      await expect(page.locator('.story-chapters [aria-current="step"]')).toHaveAttribute('href', active);
      const top = await page.locator(await links.nth(index).getAttribute('href')).evaluate(el => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThanOrEqual(71);
    }
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    if (width === 375 || width === 1440) {
      await page.screenshot({ path: `test-results/veloce-motion-${width}.png`, fullPage: true });
    }
  }
  await page.goto('/projects/sentisphere');
  await expect(page.locator('.case-story')).toHaveCount(0);
});

test('reduced motion and live preference changes reveal all content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.reveal-pending').first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.reveal-pending')).toHaveCount(0);
  await expect(page.locator('.reveal-enter')).toHaveCount(0);
  await page.goto('/projects/veloce');
  await expect(page.locator('.story-visual')).toHaveCSS('position', 'static');
  await expect(page.locator('.story-frame').first()).toHaveCSS('transition-duration', '0s');
});

test('public content and chapter anchors work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3101/projects');
  await expect(page.locator('.project-card').first()).toBeVisible();
  await page.locator('#technology').selectOption('Flutter');
  await page.getByRole('button', { name: 'Filter projects' }).click();
  await expect(page).toHaveURL(/technology=Flutter/);
  await expect(page.locator('.project-card')).toHaveCount(1);
  await page.goto('http://127.0.0.1:3101/projects/veloce');
  await page.getByRole('link', { name: 'How it works', exact: true }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.locator('#how-it-works')).toBeVisible();
  await expect(page.locator('.story-inline img').first()).toBeVisible();
  await context.close();
});
