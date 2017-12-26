// @flow
import isPartiallyWithin from '../../../../src/state/visibility/is-partially-within';
import type { Spacing } from '../../../../src/types';

const container: Spacing = {
  top: 0, left: 0, right: 100, bottom: 100,
};
const isSpacingWithinContainer = isPartiallyWithin(container);

TODO: update this to check frame of is-visible-through-frame

describe('is partially within', () => {
  describe('total visibility', () => {
    it('should return true when the item is completely visible', () => {
      const target: Spacing = {
        left: 10,
        right: 20,
        top: 20,
        bottom: 30,
      };

      expect(isSpacingWithinContainer(target)).toBe(true);
    });

    it('should return false when the item is completely invisible', () => {
      const target: Spacing = {
        left: -20,
        right: -10,
        top: -20,
        bottom: -10,
      };

      expect(isSpacingWithinContainer(target)).toBe(false);
    });

    it('should return true when is the same dimensions', () => {
      expect(isSpacingWithinContainer(container)).toBe(true);
    });
  });

  describe('partial visibility', () => {
    it('should return true when partially visible horizontally and vertically', () => {
      const target: Spacing = {
        // visible
        top: 10,
        // not visible
        bottom: 110,
        // visible
        left: 50,
        // not visible
        right: 150,
      };

      expect(isSpacingWithinContainer(target)).toBe(true);
    });

    it('should return false when only partially visible horizontally', () => {
      const target: Spacing = {
        // visible
        left: 50,
        // not visible
        top: 110,
        bottom: 150,
        right: 150,
      };

      expect(isSpacingWithinContainer(target)).toBe(false);
    });

    it('should return false when only partially visible vertically', () => {
      const target: Spacing = {
        // visible
        top: 10,
        // not visible
        bottom: 110,
        left: 110,
        right: 150,
      };

      expect(isSpacingWithinContainer(target)).toBe(false);
    });
  });
});
