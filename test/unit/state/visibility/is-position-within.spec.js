// @flow
import isPositionWithin from '../../../../src/state/visibility/is-position-within';
import type { Position, Spacing } from '../../../../src/types';

const container: Spacing = {
  top: 0, left: 0, right: 100, bottom: 100,
};
const isWithinContainer = isPositionWithin(container);

describe('is position within', () => {
  it('should return true if within the container', () => {
    expect(isWithinContainer({ x: 10, y: 10 })).toBe(true);
  });

  it('should return true if on any border', () => {
    const corners: Position[] = [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];

    corners.forEach((point: Position) => {
      expect(isWithinContainer(point)).toBe(true);
    });
  });

  it('should return false if outside on any side', () => {
    const outside: Position[] = [
      // on the top
      { x: 0, y: -1 },
      // on the bottom
      { x: 0, y: 101 },
      // on the right
      { x: 101, y: 0 },
      // on the left
      { x: -1, y: 0 },
    ];

    outside.forEach((point: Position) => {
      expect(isWithinContainer(point)).toBe(false);
    });
  });
});
