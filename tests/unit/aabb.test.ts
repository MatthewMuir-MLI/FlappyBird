import { describe, expect, it } from 'vitest';
import { type AABB, aabbsOverlap, birdAABB } from '../../src/core/aabb';

describe('aabbsOverlap', () => {
  const a: AABB = { x: 0, y: 0, width: 10, height: 10 };

  it('returns true when two boxes overlap', () => {
    const b: AABB = { x: 5, y: 5, width: 10, height: 10 };
    expect(aabbsOverlap(a, b)).toBe(true);
  });

  it('returns false when boxes are separated horizontally', () => {
    const b: AABB = { x: 20, y: 0, width: 10, height: 10 };
    expect(aabbsOverlap(a, b)).toBe(false);
  });

  it('returns false when boxes are separated vertically', () => {
    const b: AABB = { x: 0, y: 20, width: 10, height: 10 };
    expect(aabbsOverlap(a, b)).toBe(false);
  });

  it('returns true when boxes share exactly one edge (touching counts as collision)', () => {
    const b: AABB = { x: 10, y: 0, width: 10, height: 10 };
    expect(aabbsOverlap(a, b)).toBe(true);
  });
});

describe('birdAABB', () => {
  it('produces a 48x48 box centered on the bird position', () => {
    const box = birdAABB({ position: { x: 270, y: 240 }, velocity: { x: 0, y: 0 } });
    expect(box).toEqual({ x: 246, y: 216, width: 48, height: 48 });
  });
});
