import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';

const SCREENSHOT_PATH = 'artifacts/main-scene.png';
const FLAP_SCREENSHOT_PATH = 'artifacts/mid-flap.png';

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

test('clicking the canvas flaps the bird upward versus no input control', async ({ page }) => {
  const measureAtFrame = async (frame: number): Promise<number> => {
    await page.waitForFunction(
      (targetFrame) => {
        const current = document.querySelector('canvas')?.getAttribute('data-bird-frame');
        return Number(current) >= targetFrame;
      },
      frame,
      { timeout: 10_000 }
    );

    return Number(
      await page.evaluate(() => document.querySelector('canvas')?.getAttribute('data-bird-y'))
    );
  };

  await page.goto('/FlappyBird/');
  await page.waitForSelector('canvas[data-phaser-ready="true"]', { timeout: 10_000 });

  const controlY = await measureAtFrame(20);

  await page.goto('/FlappyBird/');
  await page.waitForSelector('canvas[data-phaser-ready="true"]', { timeout: 10_000 });
  await page.click('canvas');

  const flapY = await measureAtFrame(20);

  expect(flapY).toBeLessThan(controlY);

  mkdirSync(dirname(FLAP_SCREENSHOT_PATH), { recursive: true });
  await page.screenshot({ path: FLAP_SCREENSHOT_PATH, fullPage: false });
});
