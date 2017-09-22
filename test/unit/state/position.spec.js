// @flow
import {
  add,
  subtract,
  isEqual,
  negate,
  patch,
  distance,
  closest,
  offsetSpacing,
} from '../../../src/state/position';
import type { Position } from '../../../src/types';

const point1: Position = {
  x: 10,
  y: 5,
};
const point2: Position = {
  x: 2,
  y: 1,
};
const origin: Position = { x: 0, y: 0 };

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

    it('should not negate 0 to -0', () => {
      const original: Position = { x: 0, y: 0 };
      expect(negate(original)).toEqual(original);
    });
  });

  describe('patch', () => {
    it('should patch position with a y value', () => {
      expect(patch('x', 5)).toEqual({ x: 5, y: 0 });
    });

    it('should patch a position with a x value', () => {
      expect(patch('y', 5)).toEqual({ x: 0, y: 5 });
    });

    it('should allow patching of the non primary line', () => {
      expect(patch('x', 5, 1)).toEqual({ x: 5, y: 1 });
      expect(patch('y', 5, 1)).toEqual({ x: 1, y: 5 });
    });
  });

  describe('distance', () => {
    describe('on the same axis', () => {
      it('should return the distance between two positive values', () => {
        const a = { x: 0, y: 2 };
        const b = { x: 0, y: 5 };
        expect(distance(a, b)).toEqual(3);
      });

      it('should return the distance between two negative values', () => {
        const a = { x: 0, y: -2 };
        const b = { x: 0, y: -5 };
        expect(distance(a, b)).toEqual(3);
      });

      it('should return the distance between a positive and negative value', () => {
        const a = { x: 0, y: -2 };
        const b = { x: 0, y: 3 };
        expect(distance(a, b)).toEqual(5);
      });
    });

    describe('with axis shift', () => {
      it('should account for a shift in plane', () => {
        // a '3, 4, 5' triangle
        // https://www.mathsisfun.com/pythagoras.html
        const target = { x: 3, y: 4 };
        expect(distance(origin, target)).toEqual(5);
      });

      it('should account for a negative shift in plane', () => {
        // a reverse '3, 4, 5' triangle shifted down to (-1, -1)
        const customOrigin = { x: -1, y: -1 };
        const target = { x: -4, y: -5 };
        expect(distance(customOrigin, target)).toEqual(5);
      });
    });
  });

  describe('closest', () => {
    it('should return the closest distance from a series of options', () => {
      const option1 = { x: 1, y: 1 };
      const option2 = { x: 2, y: 2 };

      expect(closest(origin, [option1, option2])).toEqual(distance(origin, option1));
    });
  });

  describe('offsetSpacing', () => {
    it('should add x/y values to top/right/bottom/left dimensions', () => {
      const spacing = {
        top: 8,
        right: 16,
        bottom: 23,
        left: 5,
      };
      const expected = {
        top: 13,
        right: 26,
        bottom: 28,
        left: 15,
      };
      expect(offsetSpacing(spacing, point1)).toEqual(expected);
    });
  });
});
