// @flow
import { add, subtract, isEqual, negate } from '../../../src/state/position';
import type { Position } from '../../../src/types';

const point1: Position = {
  x: 10,
  y: 5,
};
const point2: Position = {
  x: 2,
  y: 1,
};

describe('position', () => {
  describe('add', () => {
    it('should add two points together', () => {
      const expected: Position = { x: 12, y: 6 };
      expect(add(point1, point2)).toEqual(expected);
    });
  });

  describe('subtract', () => {
    it('should subtract two points together', () => {
      const expected: Position = { x: 8, y: 4 };
      expect(subtract(point1, point2)).toEqual(expected);
    });
  });

  describe('is equal', () => {
    it('should return true when two objects are the same', () => {
      expect(isEqual(point1, point1)).toBe(true);
    });

    it('should return true when two objects share the same value', () => {
      const copy = {
        ...point1,
      };
      expect(isEqual(point1, copy)).toBe(true);
    });

    it('should return value when two objects have different values', () => {
      expect(isEqual(point1, point2)).toBe(false);
    });
  });

  describe('negate', () => {
    it('should return the inverse of the provided point', () => {
      const expected: Position = { x: -point1.x, y: -point1.y };
      expect(negate(point1)).toEqual(expected);
    });
  });
});
