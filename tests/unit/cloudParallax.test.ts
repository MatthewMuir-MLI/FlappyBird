import { describe, expect, it } from 'vitest';
import {
  type Cloud,
  type CloudParallaxConstants,
  initialClouds,
  stepClouds,
} from '../../src/core/cloudParallax';

const CONSTANTS: CloudParallaxConstants = {
  speed: 30,
  canvasWidth: 540,
  cloudWidth: 200,
};

describe('initialClouds', () => {
  it('returns the requested count', () => {
    expect(initialClouds(540, 960, 3)).toHaveLength(3);
    expect(initialClouds(540, 960, 5)).toHaveLength(5);
  });

  it('places clouds inside the canvas horizontally', () => {
    const clouds = initialClouds(540, 960, 3);
    for (const cloud of clouds) {
      expect(cloud.x).toBeGreaterThanOrEqual(0);
      expect(cloud.x).toBeLessThanOrEqual(540);
    }
  });

  it('places clouds in the top half of the canvas (sky region)', () => {
    const clouds = initialClouds(540, 960, 5);
    for (const cloud of clouds) {
      expect(cloud.y).toBeGreaterThanOrEqual(0);
      expect(cloud.y).toBeLessThanOrEqual(480);
    }
  });

  it('does not stack two clouds on the exact same point (vary x and y)', () => {
    const clouds = initialClouds(540, 960, 4);
    const seen = new Set<string>();
    for (const cloud of clouds) {
      const key = `${cloud.x},${cloud.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe('stepClouds', () => {
  it('drifts each cloud left by speed * dt', () => {
    const clouds: Cloud[] = [{ x: 300, y: 100 }];
    const next = stepClouds(clouds, 1, CONSTANTS);
    expect(next[0]?.x).toBe(270); // 300 - 30*1
    expect(next[0]?.y).toBe(100); // y unchanged
  });

  it('preserves cloud count', () => {
    const clouds = initialClouds(540, 960, 3);
    const next = stepClouds(clouds, 0.016, CONSTANTS);
    expect(next).toHaveLength(3);
  });

  it('wraps a cloud back to the right edge once it is fully off-screen left', () => {
    // Place a cloud just past the left wrap threshold (x < -cloudWidth).
    const clouds: Cloud[] = [{ x: -CONSTANTS.cloudWidth - 1, y: 200 }];
    const next = stepClouds(clouds, 0, CONSTANTS);
    // After wrap, the cloud's new x should be on the right side of the canvas,
    // shifted by (canvasWidth + cloudWidth) from the wrapped position.
    expect(next[0]?.x).toBeGreaterThan(CONSTANTS.canvasWidth - CONSTANTS.cloudWidth);
    expect(next[0]?.x).toBeLessThanOrEqual(CONSTANTS.canvasWidth + CONSTANTS.cloudWidth);
  });

  it('does not wrap a cloud that is only partially off-screen left', () => {
    // Cloud at x=-50: still partially visible on the left edge of a 540-wide canvas
    // when cloudWidth is 200. Should NOT wrap.
    const clouds: Cloud[] = [{ x: -50, y: 200 }];
    const next = stepClouds(clouds, 0, CONSTANTS);
    expect(next[0]?.x).toBe(-50);
  });

  it('keeps y unchanged across drift and wrap', () => {
    const clouds: Cloud[] = [
      { x: 200, y: 100 },
      { x: -CONSTANTS.cloudWidth - 1, y: 250 },
    ];
    const next = stepClouds(clouds, 1, CONSTANTS);
    expect(next[0]?.y).toBe(100);
    expect(next[1]?.y).toBe(250);
  });

  it('is a pure function (does not mutate input)', () => {
    const clouds: Cloud[] = [{ x: 300, y: 100 }];
    const snapshot = JSON.stringify(clouds);
    stepClouds(clouds, 1, CONSTANTS);
    expect(JSON.stringify(clouds)).toBe(snapshot);
  });
});
