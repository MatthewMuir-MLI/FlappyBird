import { aabbsOverlap, birdAABB } from './aabb';
import { type BirdState, step as stepBird } from './birdPhysics';
import { nextGapY, type Pipe, spawnPipe, stepPipe } from './pipe';

export interface GameState {
  bird: BirdState;
  pipes: Pipe[];
  pipesSpawned: number;
  pixelsUntilNextSpawn: number;
  gameOver: boolean;
}

export interface GameConstants {
  gravity: number;
  pipeSpeed: number;
  pipeSpawnDistance: number;
  canvasWidth: number;
  canvasHeight: number;
  pipeWidth: number;
  pipeGapHeight: number;
  pipeGapYMin: number;
  pipeGapYMax: number;
}

export function initialGameState(bird: BirdState, pixelsUntilFirstSpawn = 0): GameState {
  return {
    bird,
    pipes: [],
    pipesSpawned: 0,
    pixelsUntilNextSpawn: pixelsUntilFirstSpawn,
    gameOver: false,
  };
}

export function step(state: GameState, dtSeconds: number, c: GameConstants): GameState {
  if (state.gameOver) return state;

  const nextBird = stepBird(state.bird, dtSeconds, { gravity: c.gravity });
  let pipes = state.pipes.map((p) => stepPipe(p, dtSeconds, c.pipeSpeed));

  let pipesSpawned = state.pipesSpawned;
  let pixelsUntilNextSpawn = state.pixelsUntilNextSpawn - c.pipeSpeed * dtSeconds;
  while (pixelsUntilNextSpawn <= 0) {
    pipes = [
      ...pipes,
      spawnPipe({
        id: pipesSpawned,
        x: c.canvasWidth,
        canvasHeight: c.canvasHeight,
        gapCenterY: nextGapY(pipesSpawned, c.pipeGapYMin, c.pipeGapYMax),
        gapHeight: c.pipeGapHeight,
        pipeWidth: c.pipeWidth,
      }),
    ];
    pipesSpawned += 1;
    pixelsUntilNextSpawn += c.pipeSpawnDistance;
  }

  pipes = pipes.filter((p) => p.top.x + p.top.width > 0);

  const box = birdAABB(nextBird);
  const collided = pipes.some((p) => aabbsOverlap(box, p.top) || aabbsOverlap(box, p.bottom));

  return {
    bird: nextBird,
    pipes,
    pipesSpawned,
    pixelsUntilNextSpawn,
    gameOver: collided,
  };
}
