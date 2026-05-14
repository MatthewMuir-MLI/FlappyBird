import { describe, expect, it } from 'vitest';
import type { BirdState } from '../../src/core/birdPhysics';
import { type AudioPlayer, flapWithAudio, playTransitionAudio } from '../../src/core/audioEvents';
import type { GameState } from '../../src/core/gameState';
import { FLAP_VELOCITY } from '../../src/core/flight';

function makeBird(y: number): BirdState {
  return { position: { x: 270, y }, velocity: { x: 0, y: 0 } };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    bird: makeBird(240),
    pipes: [],
    pipesSpawned: 0,
    pixelsUntilNextSpawn: 0,
    score: 0,
    scoredPipeIds: [],
    gameOver: false,
    ...overrides,
  };
}

function makeAudioSpy(): {
  calls: { flap: number; score: number; hit: number };
  player: AudioPlayer;
} {
  const calls = { flap: 0, score: 0, hit: 0 };
  return {
    calls,
    player: {
      flap: () => {
        calls.flap += 1;
      },
      score: () => {
        calls.score += 1;
      },
      hit: () => {
        calls.hit += 1;
      },
    },
  };
}

describe('audioEvents core', () => {
  it('flapWithAudio applies flap impulse and triggers flap sound once', () => {
    const spy = makeAudioSpy();
    const nextBird = flapWithAudio(makeBird(240), spy.player);

    expect(nextBird.velocity.y).toBe(FLAP_VELOCITY);
    expect(spy.calls).toEqual({ flap: 1, score: 0, hit: 0 });
  });

  it('playTransitionAudio triggers score sound when score increases', () => {
    const spy = makeAudioSpy();
    playTransitionAudio(makeState({ score: 0 }), makeState({ score: 1 }), spy.player);
    expect(spy.calls).toEqual({ flap: 0, score: 1, hit: 0 });
  });

  it('playTransitionAudio triggers hit sound only when entering game-over', () => {
    const spy = makeAudioSpy();
    playTransitionAudio(makeState({ gameOver: false }), makeState({ gameOver: true }), spy.player);
    playTransitionAudio(makeState({ gameOver: true }), makeState({ gameOver: true }), spy.player);
    expect(spy.calls).toEqual({ flap: 0, score: 0, hit: 1 });
  });
});
