export interface Vec2 {
  x: number;
  y: number;
}

export interface BirdState {
  position: Vec2;
  velocity: Vec2;
}

export interface PhysicsConstants {
  /** Acceleration in px per second squared. Positive y is down in canvas coords, so gravity is positive. */
  gravity: number;
}

export function step(state: BirdState, dtSeconds: number, c: PhysicsConstants): BirdState {
  if (dtSeconds === 0) return state;
  // Semi-implicit Euler: integrate velocity first, then position uses the new velocity.
  // More stable than explicit Euler at any dt, and means gravity moves the bird
  // immediately on the first frame rather than after a one-frame delay.
  const newVelocity = {
    x: state.velocity.x,
    y: state.velocity.y + c.gravity * dtSeconds,
  };
  return {
    position: {
      x: state.position.x + newVelocity.x * dtSeconds,
      y: state.position.y + newVelocity.y * dtSeconds,
    },
    velocity: newVelocity,
  };
}
