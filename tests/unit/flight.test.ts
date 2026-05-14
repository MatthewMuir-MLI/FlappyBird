import { describe, expect, it } from 'vitest';
import { type BirdState, type PhysicsConstants, step } from '../../src/core/birdPhysics';
import { FLAP_VELOCITY, flap } from '../../src/core/flight';

const constants: PhysicsConstants = { gravity: 1500 };

const initial: BirdState = {
  position: { x: 270, y: 480 },
  velocity: { x: 0, y: 0 },
};

describe('flight core', () => {
  it('flap applies an upward vertical velocity', () => {
    const flapped = flap(initial);

    expect(flapped.velocity.y).toBe(FLAP_VELOCITY);
    expect(flapped.velocity.y).toBeLessThan(0);
  });

  it('after flap and gravity ticks, bird rises then falls', () => {
    let state = flap(initial);
    const positions: [number, ...number[]] = [state.position.y];

    for (let i = 0; i < 60; i += 1) {
      state = step(state, 1 / 60, constants);
      positions.push(state.position.y);
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
