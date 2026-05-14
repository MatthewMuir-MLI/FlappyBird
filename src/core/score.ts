import type { Pipe } from './pipe';

export interface ScoreUpdate {
  score: number;
  scoredPipeIds: number[];
}

export function scorePassedPipes(
  birdX: number,
  pipes: Pipe[],
  scoredPipeIds: number[],
  collided: boolean
): ScoreUpdate {
  if (collided) {
    return { score: 0, scoredPipeIds: [...scoredPipeIds] };
  }

  const seen = new Set(scoredPipeIds);
  const nextScoredPipeIds = [...scoredPipeIds];
  let score = 0;

  for (const pipe of pipes) {
    if (seen.has(pipe.id)) continue;

    const pipeRight = pipe.top.x + pipe.top.width;
    if (birdX > pipeRight) {
      seen.add(pipe.id);
      nextScoredPipeIds.push(pipe.id);
      score += 1;
    }
  }

  return { score, scoredPipeIds: nextScoredPipeIds };
}
