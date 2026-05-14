import { expect, test } from '@playwright/test';

test('multiple pipes spawn as the world scrolls', async ({ page }) => {
  await page.goto('/FlappyBird/');
  await page.waitForSelector('canvas[data-phaser-ready="true"]', { timeout: 10_000 });

  // Reactive flap so the bird doesn't end the run before the second pipe spawns.
  // First pipe (gap y=240) is the onboarding pipe matching the bird's start.
  // Second pipe spawns ~700ms later at a varied gap y.
  const deadline = Date.now() + 4_000;
  let observedPipeCount = 0;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return {
        y: Number(c?.getAttribute('data-bird-y') ?? '0'),
        pipeCount: Number(c?.getAttribute('data-pipe-count') ?? '0'),
        gameOver: c?.getAttribute('data-game-over') === 'true',
      };
    });
    observedPipeCount = Math.max(observedPipeCount, state.pipeCount);
    if (observedPipeCount >= 2) break;
    if (state.gameOver) break;
    if (state.y > 260) await page.keyboard.press('Space');
    await page.waitForTimeout(30);
  }

  expect(observedPipeCount).toBeGreaterThanOrEqual(2);
});
