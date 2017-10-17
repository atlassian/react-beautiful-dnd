// @flow
import {
  add,
  addPosition,
  isEqual,
  offset,
  getCorners,
} from '../../../src/state/spacing';
import type { Position, Spacing } from '../../../src/types';

const spacing1: Spacing = {
  top: 8,
  right: 16,
  bottom: 23,
  left: 5,
};

const spacing2: Spacing = {
  top: 3,
  right: 10,
  bottom: 14,
  left: 9,
};

describe('spacing', () => {
  describe('add', () => {
    it('should add two spacing boxes together', () => {
      const expected: Spacing = {
        top: 11,
        right: 26,
        bottom: 37,
        left: 14,
      };
      expect(add(spacing1, spacing2)).toEqual(expected);
    });
  });

  describe('addPosition', () => {
    it('should add a position to the right and bottom bounds of a spacing box', () => {
      const spacing = {
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
        top: 0,
        right: 15,
        bottom: 15,
        left: 0,
      };
      expect(addPosition(spacing, position)).toEqual(expected);
    });
  });

  describe('isEqual', () => {
    it('should return true when two spacings are the same', () => {
      expect(isEqual(spacing1, spacing1)).toBe(true);
    });

    it('should return true when two spacings share the same values', () => {
      const copy = { ...spacing1 };
      expect(isEqual(spacing1, copy)).toBe(true);
    });

    it('should return value when two spacings have different values', () => {
      expect(isEqual(spacing1, spacing2)).toBe(false);
    });
  });

  describe('offset', () => {
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
      expect(offset(spacing1, offsetPosition)).toEqual(expected);
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
