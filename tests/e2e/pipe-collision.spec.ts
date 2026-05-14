import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';

const APPROACH_SCREENSHOT = 'artifacts/pipe-approach.png';

test('bird falls into the pipe and game-over state is published', async ({ page }) => {
  await page.goto('/FlappyBird/');
  await page.waitForSelector('canvas[data-phaser-ready="true"]', { timeout: 10_000 });

  const canvas = page.locator('canvas');
  expect(await canvas.getAttribute('data-game-over')).toBe('false');

  // Capture the approach frame for the PR before the collision freezes everything.
  await page.waitForTimeout(400);
  mkdirSync(dirname(APPROACH_SCREENSHOT), { recursive: true });
  await page.screenshot({ path: APPROACH_SCREENSHOT, fullPage: false });

  await expect
    .poll(async () => canvas.getAttribute('data-game-over'), { timeout: 3_000 })
    .toBe('true');
});

test('reactive flapping keeps the bird in the gap while the pipe passes', async ({ page }) => {
  await page.goto('/FlappyBird/');
  await page.waitForSelector('canvas[data-phaser-ready="true"]', { timeout: 10_000 });

  // Flap only when the bird drifts below the gap mid-line. Reactive control is
  // more robust to Playwright's timing jitter than a fixed-interval flap loop.
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return {
        y: Number(c?.getAttribute('data-bird-y') ?? '0'),
        gameOver: c?.getAttribute('data-game-over') === 'true',
        frame: Number(c?.getAttribute('data-bird-frame') ?? '0'),
      };
    });
    if (state.gameOver) break;
    // Once the pipe has fully scrolled past (~1.2s of game time at 60fps), bird is safe.
    if (state.frame > 90) break;
    if (state.y > 260) await page.keyboard.press('Space');
    await page.waitForTimeout(30);
  }

  expect(await page.locator('canvas').getAttribute('data-game-over')).toBe('false');
});
