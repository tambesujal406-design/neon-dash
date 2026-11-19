import { describe, expect, it } from 'vitest';
import { overlaps } from './geometry';

const box = { width: 10, height: 10 };

describe('overlaps', () => {
  it('detects overlapping boxes', () => {
    expect(overlaps({ x: 0, y: 0 }, box, { x: 5, y: 5 }, box)).toBe(true);
  });

  it('ignores boxes that are apart or only touching', () => {
    expect(overlaps({ x: 0, y: 0 }, box, { x: 20, y: 0 }, box)).toBe(false);
    expect(overlaps({ x: 0, y: 0 }, box, { x: 10, y: 0 }, box)).toBe(false);
    expect(overlaps({ x: 0, y: 0 }, box, { x: 0, y: 10 }, box)).toBe(false);
  });
});
