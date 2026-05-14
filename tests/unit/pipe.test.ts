import { describe, expect, it } from 'vitest';
import { spawnPipe, stepPipe } from '../../src/core/pipe';

describe('spawnPipe', () => {
  it('produces top and bottom AABBs framing the configured gap', () => {
    const pipe = spawnPipe({
      x: 540,
      canvasHeight: 960,
      gapCenterY: 240,
      gapHeight: 270,
      pipeWidth: 80,
    });
    expect(pipe.top).toEqual({ x: 540, y: 0, width: 80, height: 105 });
    expect(pipe.bottom).toEqual({ x: 540, y: 375, width: 80, height: 585 });
  });
});

describe('stepPipe', () => {
  it('translates both AABBs left by speed * dt', () => {
    const pipe = spawnPipe({
      x: 540,
      canvasHeight: 960,
      gapCenterY: 240,
      gapHeight: 270,
      pipeWidth: 80,
    });
    const stepped = stepPipe(pipe, 0.5, 400);
    expect(stepped.top.x).toBe(340);
    expect(stepped.bottom.x).toBe(340);
    expect(stepped.top.y).toBe(pipe.top.y);
    expect(stepped.top.width).toBe(pipe.top.width);
    expect(stepped.top.height).toBe(pipe.top.height);
  });

  it('is a no-op when dt is zero', () => {
    const pipe = spawnPipe({
      x: 540,
      canvasHeight: 960,
      gapCenterY: 240,
      gapHeight: 270,
      pipeWidth: 80,
    });
    expect(stepPipe(pipe, 0, 400)).toEqual(pipe);
  });
});
