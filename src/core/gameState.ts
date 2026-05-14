import { aabbsOverlap, birdAABB } from './aabb';
import { type BirdState, step as stepBird } from './birdPhysics';
import { type Pipe, stepPipe } from './pipe';

export interface GameState {
  bird: BirdState;
  pipe: Pipe;
  gameOver: boolean;
}

export interface GameConstants {
  gravity: number;
  pipeSpeed: number;
}

export function step(state: GameState, dtSeconds: number, c: GameConstants): GameState {
  if (state.gameOver) return state;

  const nextBird = stepBird(state.bird, dtSeconds, { gravity: c.gravity });
  const nextPipe = stepPipe(state.pipe, dtSeconds, c.pipeSpeed);
  const box = birdAABB(nextBird);
  const collided = aabbsOverlap(box, nextPipe.top) || aabbsOverlap(box, nextPipe.bottom);

  return {
    bird: nextBird,
    pipe: nextPipe,
    gameOver: collided,
  };
}
