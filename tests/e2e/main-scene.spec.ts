import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';

const SCREENSHOT_PATH = 'artifacts/main-scene.png';

test('bird falls under gravity in the Main scene', async ({ page }) => {
  await page.goto('/FlappyBird/');

  // Wait for the Phaser canvas to mount and the scene to flip the ready flag.
  await page.waitForSelector('canvas[data-phaser-ready="true"]', { timeout: 10_000 });

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Read the bird's starting y from the data attribute the scene publishes each frame.
  const initialY = Number(await canvas.getAttribute('data-bird-y'));
  expect(initialY).toBeGreaterThan(0);

  // Wait long enough for noticeable fall but short enough that the bird is still on screen.
  await page.waitForTimeout(500);

  const laterY = Number(await canvas.getAttribute('data-bird-y'));
  expect(laterY).toBeGreaterThan(initialY + 50);

  mkdirSync(dirname(SCREENSHOT_PATH), { recursive: true });
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
});
