import { describe, expect, it } from 'vitest';
import { type BirdState, type PhysicsConstants, step } from '../../src/core/birdPhysics';

const constants: PhysicsConstants = { gravity: 1500 };

const initial: BirdState = {
  position: { x: 270, y: 240 },
  velocity: { x: 0, y: 0 },
};

describe('birdPhysics.step', () => {
  it('increases y over time under positive gravity', () => {
    const next = step(initial, 0.1, constants);
    expect(next.position.y).toBeGreaterThan(initial.position.y);
  });

  it('increases velocity.y by gravity * dt', () => {
    const next = step(initial, 0.1, constants);
    expect(next.velocity.y).toBeCloseTo(150, 5);
  });

  it('leaves x and velocity.x unchanged', () => {
    const next = step(initial, 0.1, constants);
    expect(next.position.x).toBe(initial.position.x);
    expect(next.velocity.x).toBe(initial.velocity.x);
  });

  it('is a no-op when dt is zero', () => {
    const next = step(initial, 0, constants);
    expect(next).toEqual(initial);
  });

  it('is deterministic — same input, same output', () => {
    const a = step(initial, 0.1, constants);
    const b = step(initial, 0.1, constants);
    expect(a).toEqual(b);
  });

  it('accumulates fall distance over many steps', () => {
    let state = initial;
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      state = step(state, dt, constants);
    }
    // After ~1 second under 1500 px/s^2 gravity from rest, y has risen by ~750 px
    // (canvas y increases downward, so "fallen 750 px" => position.y is ~ initial + 750).
    expect(state.position.y).toBeGreaterThan(initial.position.y + 700);
    expect(state.position.y).toBeLessThan(initial.position.y + 800);
  });
});
