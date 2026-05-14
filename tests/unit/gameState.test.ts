import { describe, expect, it } from 'vitest';
import type { BirdState } from '../../src/core/birdPhysics';
import {
  type GameConstants,
  type GameState,
  initialGameState,
  step,
} from '../../src/core/gameState';

const CONSTANTS: GameConstants = {
  gravity: 1500,
  pipeSpeed: 400,
  pipeSpawnDistance: 280,
  canvasWidth: 540,
  canvasHeight: 960,
  pipeWidth: 80,
  pipeGapHeight: 270,
  pipeGapYMin: 200,
  pipeGapYMax: 760,
};

function makeBird(x: number, y: number): BirdState {
  return { position: { x, y }, velocity: { x: 0, y: 0 } };
}

describe('initialGameState', () => {
  it('starts with no pipes, no game-over, and spawn timer at zero', () => {
    const state = initialGameState(makeBird(270, 240));
    expect(state.pipes).toEqual([]);
    expect(state.pipesSpawned).toBe(0);
    expect(state.pixelsUntilNextSpawn).toBe(0);
    expect(state.gameOver).toBe(false);
  });
});

describe('step', () => {
  it('spawns the first pipe at canvas right edge on the very first tick', () => {
    const state = step(initialGameState(makeBird(270, 240)), 1 / 60, CONSTANTS);
    expect(state.pipes).toHaveLength(1);
    expect(state.pipes[0]?.id).toBe(0);
    expect(state.pipes[0]?.top.x).toBe(540);
    expect(state.pipesSpawned).toBe(1);
  });

  it('spawns additional pipes as the world scrolls', () => {
    let state = initialGameState(makeBird(-9999, 0));
    for (let i = 0; i < 120; i++) state = step(state, 1 / 60, CONSTANTS);
    expect(state.pipesSpawned).toBeGreaterThanOrEqual(2);
  });

  it('despawns pipes that scroll off the left edge', () => {
    let state = initialGameState(makeBird(-9999, 0));
    for (let i = 0; i < 180; i++) state = step(state, 1 / 60, CONSTANTS);
    const allOnScreen = state.pipes.every((p) => p.top.x + p.top.width > 0);
    expect(allOnScreen).toBe(true);
  });

  it('keeps active pipe count bounded over 10 simulated seconds', () => {
    let state = initialGameState(makeBird(-9999, 0));
    let maxPipes = 0;
    for (let i = 0; i < 600; i++) {
      state = step(state, 1 / 60, CONSTANTS);
      maxPipes = Math.max(maxPipes, state.pipes.length);
    }
    expect(maxPipes).toBeLessThanOrEqual(5);
  });

  it('triggers game-over when the bird overlaps any pipe', () => {
    let state = initialGameState(makeBird(560, 600));
    state = step(state, 1 / 60, CONSTANTS);
    expect(state.gameOver).toBe(true);
  });

  it('freezes the simulation once game-over is set', () => {
    const initial = initialGameState(makeBird(560, 600));
    const dead: GameState = { ...initial, gameOver: true };
    const next = step(dead, 1 / 60, CONSTANTS);
    expect(next).toEqual(dead);
  });
});
