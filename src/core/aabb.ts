import type { BirdState } from './birdPhysics';

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const BIRD_SIZE = 48;

export function aabbsOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
  );
}

export function birdAABB(bird: BirdState): AABB {
  const half = BIRD_SIZE / 2;
  return {
    x: bird.position.x - half,
    y: bird.position.y - half,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
  };
}
