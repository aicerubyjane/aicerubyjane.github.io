const { test, expect } = require('@playwright/test');

test('hero image tidak loncat saat toggle dark mode', async ({ page }) => {
  await page.goto('/');

  const hero = page.locator('.hero');
  const heroMedia = page.locator('.hero-media');
  const heroImages = page.locator('.hero-bg');

  await expect(hero).toBeVisible();
  await expect(heroMedia).toBeVisible();
  await expect(heroImages).toHaveCount(1);

  const before = await hero.boundingBox();
  const mediaBefore = await heroMedia.boundingBox();
  const imageBoxesBefore = await heroImages.evaluateAll((images) =>
    images.map((image) => {
      const rect = image.getBoundingClientRect();
      const style = window.getComputedStyle(image);

      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        transform: style.transform,
      };
    })
  );

  expect(before).not.toBeNull();
  expect(mediaBefore).not.toBeNull();

  const themeToggle = page.locator('.theme-toggle, #theme-toggle, [data-testid="theme-toggle"]').first();

  if (await themeToggle.count()) {
    await themeToggle.click();
  } else {
    await page.evaluate(() => {
      document.documentElement.classList.toggle('dark');
      document.body.classList.toggle('dark');
    });
  }

  await page.waitForTimeout(500);

  const after = await hero.boundingBox();
  const mediaAfter = await heroMedia.boundingBox();
  const imageBoxesAfter = await heroImages.evaluateAll((images) =>
    images.map((image) => {
      const rect = image.getBoundingClientRect();
      const style = window.getComputedStyle(image);

      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        transform: style.transform,
      };
    })
  );

  expect(after).not.toBeNull();
  expect(mediaAfter).not.toBeNull();

  expect(Math.abs((before?.x ?? 0) - (after?.x ?? 0))).toBeLessThanOrEqual(3);
  expect(Math.abs((before?.y ?? 0) - (after?.y ?? 0))).toBeLessThanOrEqual(3);
  expect(Math.abs((before?.width ?? 0) - (after?.width ?? 0))).toBeLessThanOrEqual(3);
  expect(Math.abs((before?.height ?? 0) - (after?.height ?? 0))).toBeLessThanOrEqual(3);

  expect(Math.abs((mediaBefore?.x ?? 0) - (mediaAfter?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((mediaBefore?.y ?? 0) - (mediaAfter?.y ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((mediaBefore?.width ?? 0) - (mediaAfter?.width ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((mediaBefore?.height ?? 0) - (mediaAfter?.height ?? 0))).toBeLessThanOrEqual(1);

  expect(imageBoxesAfter).toHaveLength(imageBoxesBefore.length);

  imageBoxesBefore.forEach((imageBefore, index) => {
    const imageAfter = imageBoxesAfter[index];

    expect(Math.abs(imageBefore.x - imageAfter.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageBefore.y - imageAfter.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageBefore.width - imageAfter.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageBefore.height - imageAfter.height)).toBeLessThanOrEqual(1);
    expect(imageAfter.objectFit).toBe(imageBefore.objectFit);
    expect(imageAfter.objectPosition).toBe(imageBefore.objectPosition);
    expect(imageAfter.transform).toBe(imageBefore.transform);
  });
});
