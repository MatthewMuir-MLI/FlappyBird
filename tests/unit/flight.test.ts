import { describe, expect, it } from 'vitest';
import { createBirdState, FLAP_VELOCITY, flap, tickBird } from '../../src/core/flight';

describe('flight core', () => {
  it('flap applies an upward vertical velocity', () => {
    const state = createBirdState(480);
    const flapped = flap(state);

    expect(flapped.velocityY).toBe(FLAP_VELOCITY);
    expect(flapped.velocityY).toBeLessThan(0);
  });

  it('after flap and gravity ticks, bird rises then falls', () => {
    let state = flap(createBirdState(480));
    const positions: [number, ...number[]] = [state.y];

    for (let i = 0; i < 60; i += 1) {
      state = tickBird(state, 1 / 60);
      positions.push(state.y);
    }

    const minY = Math.min(...positions);
    const peakIndex = positions.indexOf(minY);
    const startY = positions[0];
    const endY = positions[positions.length - 1];

    expect(peakIndex).toBeGreaterThan(0);
    expect(minY).toBeLessThan(startY);
    expect(endY).toBeGreaterThan(minY);
  });
});
