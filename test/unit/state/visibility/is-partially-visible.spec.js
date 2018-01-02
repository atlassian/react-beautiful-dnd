// @flow
import getArea from '../../../../src/state/get-area';
import isPartiallyVisible from '../../../../src/state/visibility/is-partially-visible';
import { getDroppableDimension } from '../../../../src/state/dimension';
import { offset } from '../../../../src/state/spacing';
import type {
  Area,
  DroppableDimension,
  DraggableDimension,
  Position,
  Spacing,
} from '../../../../src/types';

const viewport: Area = getArea({
  right: 800,
  top: 0,
  left: 0,
  bottom: 600,
});

const asBigAsViewport: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'huge',
    type: 'TYPE',
  },
  client: viewport,
});

const inViewport1: Spacing = {
  top: 10,
  left: 10,
  right: 100,
  bottom: 100,
};

const inViewport2: Spacing = {
  top: 10,
  left: 200,
  right: 400,
  bottom: 100,
};

const notInViewport: Spacing = {
  top: 0,
  right: 1000,
  left: 900,
  bottom: 600,
};

const smallDroppable: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'subset',
    type: 'TYPE',
  },
  client: getArea(inViewport1),
});

describe('is partially visible', () => {
  describe('viewport', () => {
    it('should return false if the item is not in the viewport', () => {
      expect(isPartiallyVisible({
        target: notInViewport,
        viewport,
        droppable: asBigAsViewport,
      })).toBe(false);
    });

    it('should return true if item takes up entire viewport', () => {
      expect(isPartiallyVisible({
        target: viewport,
        viewport,
        droppable: asBigAsViewport,
      })).toBe(true);
    });

    it('should return true if the item is totally visible in the viewport', () => {
      expect(isPartiallyVisible({
        target: inViewport1,
        viewport,
        droppable: asBigAsViewport,
      })).toBe(true);
    });

    it('should return true if the item is partially visible in the viewport', () => {
      const partials: Spacing[] = [
        // bleed over top
        offset(viewport, { x: 0, y: -1 }),
        // bleed over right
        offset(viewport, { x: 1, y: 0 }),
        // bleed over bottom
        offset(viewport, { x: 0, y: 1 }),
        // bleed over left
        offset(viewport, { x: -1, y: 0 }),
      ];

      partials.forEach((partial: Spacing) => {
        expect(isPartiallyVisible({
          target: partial,
          viewport,
          droppable: asBigAsViewport,
        })).toBe(true);
      });
    });
  });

  describe('droppable', () => {
    describe('without changes in droppable scroll', () => {
      it('should return false if outside the droppable', () => {
        expect(isPartiallyVisible({
          target: inViewport2,
          viewport,
          droppable: smallDroppable,
        })).toBe(false);
      });

      it('should return true if the target is bigger than the droppable', () => {
        expect(isPartiallyVisible({
          target: viewport,
          viewport,
          droppable: smallDroppable,
        })).toBe(true);
      });

      it('should return true if the same size of the droppable', () => {
        expect(isPartiallyVisible({
          target: inViewport1,
          viewport,
          droppable: smallDroppable,
        })).toBe(true);
      });

      it('should return true if within the droppable', () => {
        const insideDroppable: Spacing = {
          top: 20,
          left: 20,
          right: 80,
          bottom: 80,
        };

        expect(isPartiallyVisible({
          target: insideDroppable,
          viewport,
          droppable: smallDroppable,
        })).toBe(true);
      });

      it('should return true if partially within the droppable', () => {
        const partials: Spacing[] = [
        // bleed over top
          offset(inViewport1, { x: 0, y: -1 }),
          // bleed over right
          offset(inViewport1, { x: 1, y: 0 }),
          // bleed over bottom
          offset(inViewport1, { x: 0, y: 1 }),
          // bleed over left
          offset(inViewport1, { x: -1, y: 0 }),
        ];

        partials.forEach((partial: Spacing) => {
          expect(isPartiallyVisible({
            target: partial,
            viewport,
            droppable: smallDroppable,
          })).toBe(true);
        });
      });
    });
  });

  describe('viewport + droppable', () => {
    it('should return true if visible in the viewport and the droppable', () => {
      expect(isPartiallyVisible({
        target: inViewport1,
        viewport,
        droppable: smallDroppable,
      })).toBe(true);
    });

    it('should return false if not visible in the droppable even if visible in the viewport', () => {
      expect(isPartiallyVisible({
        target: inViewport2,
        viewport,
        droppable: smallDroppable,
      })).toBe(false);
    });

    it('should return false if not visible in the viewport even if visible in the droppable', () => {
      const notVisibleDroppable = getDroppableDimension({
        descriptor: {
          id: 'not-visible',
          type: 'TYPE',
        },
        client: getArea(notInViewport),
      });

      expect(isPartiallyVisible({
        // is visibile in the droppable
        target: notInViewport,
        // but not visible in the viewport
        viewport,
        droppable: notVisibleDroppable,
      })).toBe(false);
    });
  });
});
