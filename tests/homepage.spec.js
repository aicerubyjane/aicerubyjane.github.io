const { test, expect } = require('@playwright/test');

test('homepage kebuka dan elemen utama muncul', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Aicerubyjane/i);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.hero')).toBeVisible();
});

test('gambar kucing berganti tanpa mengubah posisi panggung', async ({ page }) => {
  await page.goto('/');

  const split = page.locator('.design-code .hero-split');
  const stage = page.locator('.cat-stage');
  const design = page.locator('.hero-side-design');
  const code = page.locator('.hero-side-code');

  await split.scrollIntoViewIfNeeded();
  await expect(page.locator('.cat-layer')).toHaveCount(8);
  await expect.poll(async () => page.locator('.cat-layer').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.waitForTimeout(700);

  const before = await stage.boundingBox();
  await design.hover();
  await expect(split).toHaveClass(/is-design-focus/);
  await expect(page.locator('.cat-layer-design')).toHaveCSS('opacity', '1');

  await code.hover();
  await expect(split).toHaveClass(/is-code-focus/);
  await expect(page.locator('.cat-layer-code')).toHaveCSS('opacity', '1');

  const after = await stage.boundingBox();
  expect(after).toEqual(before);
});
