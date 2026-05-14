import { describe, expect, it } from 'vitest';
import type { BirdState } from '../../src/core/birdPhysics';
import { type GameConstants, type GameState, step } from '../../src/core/gameState';
import { spawnPipe } from '../../src/core/pipe';

const CONSTANTS: GameConstants = {
  gravity: 1500,
  pipeSpeed: 400,
};

function makeBird(x: number, y: number): BirdState {
  return { position: { x, y }, velocity: { x: 0, y: 0 } };
}

function makeState(bird: BirdState, pipeX: number): GameState {
  return {
    bird,
    pipe: spawnPipe({
      x: pipeX,
      canvasHeight: 960,
      gapCenterY: 240,
      gapHeight: 270,
      pipeWidth: 80,
    }),
    gameOver: false,
  };
}

describe('step', () => {
  it('does not trigger game-over while the bird is in the gap', () => {
    let state = makeState(makeBird(270, 240), 540);
    for (let i = 0; i < 30; i++) {
      state = step(state, 1 / 60, CONSTANTS);
      // Hold the bird in the gap by zeroing vertical velocity each frame.
      state = { ...state, bird: { ...state.bird, velocity: { x: 0, y: 0 } } };
    }
    expect(state.gameOver).toBe(false);
  });

  it('triggers game-over when the bird overlaps the top pipe', () => {
    const bird = makeBird(560, 40);
    const state = step(makeState(bird, 540), 1 / 60, CONSTANTS);
    expect(state.gameOver).toBe(true);
  });

  it('triggers game-over when the bird overlaps the bottom pipe', () => {
    const bird = makeBird(560, 600);
    const state = step(makeState(bird, 540), 1 / 60, CONSTANTS);
    expect(state.gameOver).toBe(true);
  });

  it('freezes simulation once game-over is set', () => {
    const initial: GameState = { ...makeState(makeBird(560, 600), 540), gameOver: true };
    const next = step(initial, 1 / 60, CONSTANTS);
    expect(next.bird).toEqual(initial.bird);
    expect(next.pipe).toEqual(initial.pipe);
    expect(next.gameOver).toBe(true);
  });
});
