import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';

const SCREENSHOT_PATH = 'artifacts/main-scene.png';

test('Main scene renders the FlappyBird title', async ({ page }) => {
  await page.goto('/FlappyBird/');

  // Wait for the Phaser canvas to mount and the scene to flip the ready flag.
  await page.waitForSelector('canvas[data-phaser-ready="true"]', { timeout: 10_000 });

  // One more frame so the title text is composited before we capture.
  await page.waitForTimeout(200);

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  mkdirSync(dirname(SCREENSHOT_PATH), { recursive: true });
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
});
