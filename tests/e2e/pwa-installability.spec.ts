import { expect, test } from '@playwright/test';

test('manifest is valid and service worker becomes active', async ({ page }) => {
  const manifestResponse = await page.request.get('/FlappyBird/manifest.json');
  expect(manifestResponse.status()).toBe(200);

  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('FlappyBird');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');

  const iconSizes = new Set<string>(
    (manifest.icons ?? []).map((icon: { sizes: string }) => icon.sizes)
  );
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

  const serviceWorkerState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker?.getRegistration();
    return {
      hasRegistration: Boolean(registration),
      hasActiveWorker: Boolean(registration?.active),
    };
  });

  expect(serviceWorkerState.hasRegistration).toBe(true);
  expect(serviceWorkerState.hasActiveWorker).toBe(true);
});
