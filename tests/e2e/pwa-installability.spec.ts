import { expect, test } from '@playwright/test';

interface ManifestIcon {
  sizes: string;
}

test('manifest is valid and service worker becomes active', async ({ page }) => {
  const manifestResponse = await page.request.get('/FlappyBird/manifest.json');
  expect(manifestResponse.status()).toBe(200);

  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('FlappyBird');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');
  expect(Array.isArray(manifest.icons)).toBe(true);

  const iconSizes = new Set<string>((manifest.icons as ManifestIcon[]).map((icon) => icon.sizes));
  expect(iconSizes.has('192x192')).toBe(true);
  expect(iconSizes.has('512x512')).toBe(true);

  await page.goto('/FlappyBird/');
  await expect
    .poll(async () => {
      return page.evaluate(async () => {
        const registration = await navigator.serviceWorker?.getRegistration();
        return Boolean(registration?.active);
      });
    })
    .toBe(true);
});
