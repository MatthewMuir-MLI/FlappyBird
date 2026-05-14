import { describe, expect, it } from 'vitest';
import { nextGapY, spawnPipe, stepPipe } from '../../src/core/pipe';

describe('spawnPipe', () => {
  it('produces top and bottom AABBs framing the configured gap and carries the id', () => {
    const pipe = spawnPipe({
      id: 7,
      x: 540,
      canvasHeight: 960,
      gapCenterY: 240,
      gapHeight: 270,
      pipeWidth: 80,
    });
    expect(pipe.id).toBe(7);
    expect(pipe.top).toEqual({ x: 540, y: 0, width: 80, height: 105 });
    expect(pipe.bottom).toEqual({ x: 540, y: 375, width: 80, height: 585 });
  });
});

describe('stepPipe', () => {
  it('translates both AABBs left by speed * dt and preserves id', () => {
    const pipe = spawnPipe({
      id: 3,
      x: 540,
      canvasHeight: 960,
      gapCenterY: 240,
      gapHeight: 270,
      pipeWidth: 80,
    });
    const stepped = stepPipe(pipe, 0.5, 400);
    expect(stepped.id).toBe(3);
    expect(stepped.top.x).toBe(340);
    expect(stepped.bottom.x).toBe(340);
    expect(stepped.top.y).toBe(pipe.top.y);
    expect(stepped.top.width).toBe(pipe.top.width);
    expect(stepped.top.height).toBe(pipe.top.height);
  });

  it('is a no-op when dt is zero', () => {
    const pipe = spawnPipe({
      id: 0,
      x: 540,
      canvasHeight: 960,
      gapCenterY: 240,
      gapHeight: 270,
      pipeWidth: 80,
    });
    expect(stepPipe(pipe, 0, 400)).toEqual(pipe);
  });
});

describe('nextGapY', () => {
  it('special-cases index 0 to the bird-start onboarding y (240)', () => {
    expect(nextGapY(0, 200, 760)).toBe(240);
  });

  it('stays within [min, max] for the first 100 indices', () => {
    for (let i = 0; i < 100; i++) {
      const y = nextGapY(i, 200, 760);
      expect(y).toBeGreaterThanOrEqual(200);
      expect(y).toBeLessThanOrEqual(760);
    }
  });

  it('produces varied values (not all the same) after the onboarding pipe', () => {
    const samples = new Set<number>();
    for (let i = 1; i < 20; i++) samples.add(Math.round(nextGapY(i, 200, 760)));
    expect(samples.size).toBeGreaterThan(5);
  });
});
