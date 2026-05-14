import { describe, expect, it } from 'vitest';
import { GameInfo } from '../../src/core/gameInfo';

describe('GameInfo', () => {
  it('title is FlappyBird', () => {
    expect(GameInfo.Title).toBe('FlappyBird');
  });

  it('version is semver', () => {
    expect(GameInfo.Version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
