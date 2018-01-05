// @flow
import isPositionInFrame from '../../../../src/state/visibility/is-position-in-frame';
import getArea from '../../../../src/state/get-area';
import type {
  Position,
  Area,
} from '../../../../src/types';

describe('is position in frame', () => {
  const frame: Area = getArea({
    top: 0, left: 0, right: 100, bottom: 100,
  });

  it('should return true if inside the frame', () => {
    expect(isPositionInFrame(frame)(frame.center)).toBe(true);
  });

  it('should return true for all corners', () => {
    const corners: Position[] = [
      // top left
      { x: 0, y: 0 },
      // top right
      { x: 100, y: 0 },
      // bottom left
      { x: 0, y: 100 },
      // bottom right
      { x: 100, y: 100 },
    ];

    corners.forEach((corner: Position) => {
      expect(isPositionInFrame(frame)(corner)).toBe(true);
    });
  });

  it('should return false if outside on any side', () => {
    const points: Position[] = [
      // top
      { x: 50, y: -1 },
      // right
      { x: 101, y: 50 },
      // bottom
      { x: 50, y: 101 },
      // left
      { x: -1, y: 50 },
    ];

    points.forEach((point: Position) => {
      expect(isPositionInFrame(frame)(point)).toBe(false);
    });
  });
});
