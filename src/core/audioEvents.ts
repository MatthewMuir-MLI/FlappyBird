import type { BirdState } from './birdPhysics';
import { flap } from './flight';
import type { GameState } from './gameState';

export interface AudioPlayer {
  flap: () => void;
  score: () => void;
  hit: () => void;
}

export function flapWithAudio(bird: BirdState, audioPlayer: AudioPlayer): BirdState {
  audioPlayer.flap();
  return flap(bird);
}

export function playTransitionAudio(
  previousState: GameState,
  nextState: GameState,
  audioPlayer: AudioPlayer
): void {
  if (nextState.score > previousState.score) {
    audioPlayer.score();
  }

  if (!previousState.gameOver && nextState.gameOver) {
    audioPlayer.hit();
  }
}
