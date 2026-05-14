// Pure logic for cloud parallax. No Phaser imports so this stays unit-testable
// per the FlappyBird CLAUDE.md rule.
//
// Clouds drift left at a constant speed and wrap back to the right edge once
// fully off-screen. Y stays fixed per cloud — clouds don't rise or fall.

export interface Cloud {
  x: number;
  y: number;
}

export interface CloudParallaxConstants {
  /** Leftward drift speed in pixels / second. Pipes move at ~400 px/s; clouds
   * should be noticeably slower to read as distant parallax. */
  speed: number;
  /** Canvas width in pixels. Used to position wraps. */
  canvasWidth: number;
  /** Display width of a cloud sprite in pixels. A cloud is "fully off-screen
   * left" when its centered x is less than -cloudWidth, i.e. its right edge
   * (cloud.x + cloudWidth/2) is past the left wall by at least cloudWidth/2.
   * Using a single cloudWidth threshold across all clouds keeps the wrap
   * deterministic and easy to unit-test. */
  cloudWidth: number;
}

/**
 * Distribute `count` clouds across the canvas:
 *   - x spaced evenly across the canvas width
 *   - y spread deterministically across the top half (sky region)
 *
 * Deterministic on purpose: tests must not be flaky, and the initial
 * arrangement should look the same on every page load.
 */
export function initialClouds(canvasWidth: number, canvasHeight: number, count: number): Cloud[] {
  const skyHeight = canvasHeight / 2;
  const xSpacing = canvasWidth / count;
  // Pseudo-random-looking y offsets that are stable across runs.
  const ySeeds = [83, 217, 41, 305, 149, 261, 67, 199];
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i++) {
    const x = i * xSpacing + xSpacing / 2;
    const ySeed = ySeeds[i % ySeeds.length] ?? 100;
    const y = 40 + (ySeed % (skyHeight - 80));
    clouds.push({ x, y });
  }
  return clouds;
}

/**
 * Drift each cloud left by `speed * dt` and wrap clouds that are fully
 * off-screen left back to the right edge. Pure — does not mutate input.
 */
export function stepClouds(clouds: Cloud[], dt: number, c: CloudParallaxConstants): Cloud[] {
  return clouds.map((cloud) => {
    let x = cloud.x - c.speed * dt;
    if (x < -c.cloudWidth) {
      x = x + c.canvasWidth + c.cloudWidth;
    }
    return { x, y: cloud.y };
  });
}
