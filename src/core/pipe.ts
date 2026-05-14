import type { AABB } from './aabb';

export interface Pipe {
  top: AABB;
  bottom: AABB;
}

export interface SpawnPipeOptions {
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
    top: { ...pipe.top, x: pipe.top.x + dx },
    bottom: { ...pipe.bottom, x: pipe.bottom.x + dx },
  };
}
