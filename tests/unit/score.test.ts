import { describe, expect, it } from 'vitest';
import type { Pipe } from '../../src/core/pipe';
import { scorePassedPipes } from '../../src/core/score';

function makePipe(id: number, x: number): Pipe {
  return {
    id,
    top: { x, y: 0, width: 80, height: 100 },
    bottom: { x, y: 300, width: 80, height: 660 },
  };
}

describe('scorePassedPipes', () => {
  it('increments by 1 when bird has passed a pipe', () => {
    const result = scorePassedPipes(300, [makePipe(1, 200)], [], false);

    expect(result.score).toBe(1);
    expect(result.scoredPipeIds).toEqual([1]);
  });

  it('does not increment on a collision tick even if the bird has crossed a pipe', () => {
    const result = scorePassedPipes(300, [makePipe(1, 200)], [], true);

    expect(result.score).toBe(0);
    expect(result.scoredPipeIds).toEqual([]);
  });

  it('never double-counts a single pipe', () => {
    const first = scorePassedPipes(300, [makePipe(1, 200)], [], false);
    const second = scorePassedPipes(350, [makePipe(1, 120)], first.scoredPipeIds, false);

    expect(first.score).toBe(1);
    expect(second.score).toBe(0);
    expect(second.scoredPipeIds).toEqual([1]);
  });
});
