import type { BirdState } from './birdPhysics';

export const FLAP_VELOCITY = -450;

export const flap = (state: BirdState): BirdState => ({
  position: { ...state.position },
  velocity: { ...state.velocity, y: FLAP_VELOCITY },
});
