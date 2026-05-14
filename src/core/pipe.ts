import type { AABB } from './aabb';

export interface Pipe {
  id: number;
  top: AABB;
  bottom: AABB;
}

export interface SpawnPipeOptions {
  id: number;
  x: number;
  canvasHeight: number;
  gapCenterY: number;
  gapHeight: number;
  pipeWidth: number;
}

export function spawnPipe(opts: SpawnPipeOptions): Pipe {
  const gapTop = opts.gapCenterY - opts.gapHeight / 2;
  const gapBottom = opts.gapCenterY + opts.gapHeight / 2;
  return {
    id: opts.id,
    top: { x: opts.x, y: 0, width: opts.pipeWidth, height: gapTop },
    bottom: {
      x: opts.x,
      y: gapBottom,
      width: opts.pipeWidth,
      height: opts.canvasHeight - gapBottom,
    },
  };
}

export function stepPipe(pipe: Pipe, dtSeconds: number, speedPxPerSec: number): Pipe {
  if (dtSeconds === 0) return pipe;
  const dx = -speedPxPerSec * dtSeconds;
  return {
    id: pipe.id,
    top: { ...pipe.top, x: pipe.top.x + dx },
    bottom: { ...pipe.bottom, x: pipe.bottom.x + dx },
  };
}

// Onboarding pipe (index 0) is centered on the bird's starting y so the first
// pipe is a freebie to pass — difficulty variation kicks in from index 1.
const ONBOARDING_GAP_Y = 240;

export function nextGapY(index: number, min: number, max: number): number {
  if (index === 0) return ONBOARDING_GAP_Y;
  const mid = (min + max) / 2;
  const amplitude = (max - min) / 2;
  return mid + amplitude * Math.sin(index * 1.7);
}
