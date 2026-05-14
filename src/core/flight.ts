export const FLAP_VELOCITY = -450;
const GRAVITY = 1200;

export type BirdState = Readonly<{
  y: number;
  velocityY: number;
}>;

export const createBirdState = (y: number): BirdState => ({
  y,
  velocityY: 0,
});

export const flap = (state: BirdState): BirdState => ({
  ...state,
  velocityY: FLAP_VELOCITY,
});

export const tickBird = (state: BirdState, deltaSeconds: number): BirdState => {
  const velocityY = state.velocityY + GRAVITY * deltaSeconds;
  return {
    y: state.y + velocityY * deltaSeconds,
    velocityY,
  };
};
