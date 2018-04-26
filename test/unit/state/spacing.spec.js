// @flow
import {
  getCorners,
  expandByPosition,
  offsetByPosition,
} from '../../../src/state/spacing';
import type { Position, Spacing } from '../../../src/types';

const base: Spacing = {
  top: 8,
  right: 16,
  bottom: 23,
  left: 5,
};

describe('spacing', () => {
  describe('expandByPosition', () => {
    it('should increase the size of the spacing', () => {
      const spacing: Spacing = {
        top: 0,
        right: 10,
        bottom: 10,
        left: 0,
      };
      const position = {
        x: 5,
        y: 5,
      };
      const expected = {
        top: -5,
        right: 15,
        bottom: 15,
        left: -5,
      };

      expect(expandByPosition(spacing, position)).toEqual(expected);
    });
  });

  describe('offsetByPosition', () => {
    it('should add x/y values to top/right/bottom/left dimensions', () => {
      const offsetPosition: Position = {
        x: 10,
        y: 5,
      };
      const expected: Spacing = {
        top: 13,
        right: 26,
        bottom: 28,
        left: 15,
      };
      expect(offsetByPosition(base, offsetPosition)).toEqual(expected);
    });
  });

  describe('getCorners', () => {
    it('should return the corners of a spacing box in the order TL, TR, BL, BR', () => {
      const spacing: Spacing = {
        top: 1,
        right: 2,
        bottom: 3,
        left: 4,
      };
      const expected = [
        { x: 4, y: 1 },
        { x: 2, y: 1 },
        { x: 4, y: 3 },
        { x: 2, y: 3 },
      ];
      expect(getCorners(spacing)).toEqual(expected);
    });
  });
});
