// @flow
import getArea from '../../../../src/state/get-area';
import isPartiallyVisible from '../../../../src/state/visibility/is-partially-visible';
import { getDroppableDimension, scrollDroppable } from '../../../../src/state/dimension';
import { offset } from '../../../../src/state/spacing';
import type {
  Area,
  DroppableDimension,
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
    id: 'same-as-viewport',
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
    describe('without changes in droppable scroll', () => {
      it('should return false if the item is not in the viewport', () => {
        expect(isPartiallyVisible({
          target: notInViewport,
          viewport,
          destination: asBigAsViewport,
        })).toBe(false);
      });

      it('should return true if item takes up entire viewport', () => {
        expect(isPartiallyVisible({
          target: viewport,
          viewport,
          destination: asBigAsViewport,
        })).toBe(true);
      });

      it('should return true if the item is totally visible in the viewport', () => {
        expect(isPartiallyVisible({
          target: inViewport1,
          viewport,
          destination: asBigAsViewport,
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
            destination: asBigAsViewport,
          })).toBe(true);
        });
      });
    });

    describe('with changes in droppable scroll', () => {
      const clippedByViewport: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'clipped',
          type: 'TYPE',
        },
        client: getArea({
          top: viewport.top,
          // stretches out the bottom of the viewport
          bottom: viewport.bottom + 100,
          left: viewport.left,
          right: viewport.right,
        }),
      });

      describe('originally invisible but now invisible', () => {
        it('should take into account the droppable scroll when detecting visibility', () => {
          const originallyInvisible: Spacing = {
            top: viewport.bottom + 1,
            bottom: viewport.bottom + 100,
            right: viewport.left + 1,
            left: viewport.left + 100,
          };

          // originally invisible
          expect(isPartiallyVisible({
            target: originallyInvisible,
            destination: clippedByViewport,
            viewport,
          })).toBe(false);

          // after scroll the target is now visible
          expect(isPartiallyVisible({
            target: originallyInvisible,
            destination: scrollDroppable(clippedByViewport, { x: 0, y: 100 }),
            viewport,
          })).toBe(true);
        });
      });

      describe('originally visible but now visible', () => {
        it('should take into account the droppable scroll when detecting visibility', () => {
          const originallyVisible: Spacing = {
            top: viewport.top,
            bottom: viewport.top + 50,
            right: viewport.left + 1,
            left: viewport.left + 100,
          };

          // originally visible
          expect(isPartiallyVisible({
            target: originallyVisible,
            destination: clippedByViewport,
            viewport,
          })).toBe(true);

          // after scroll the target is now invisible
          expect(isPartiallyVisible({
            target: originallyVisible,
            destination: scrollDroppable(clippedByViewport, { x: 0, y: 100 }),
            viewport,
          })).toBe(false);
        });
      });
    });
  });

  describe('droppable', () => {
    describe('without changes in droppable scroll', () => {
      it('should return false if outside the droppable', () => {
        expect(isPartiallyVisible({
          target: inViewport2,
          viewport,
          destination: smallDroppable,
        })).toBe(false);
      });

      it('should return true if the target is bigger than the droppable', () => {
        expect(isPartiallyVisible({
          target: viewport,
          viewport,
          destination: smallDroppable,
        })).toBe(true);
      });

      it('should return true if the same size of the droppable', () => {
        expect(isPartiallyVisible({
          target: inViewport1,
          viewport,
          destination: smallDroppable,
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
          destination: smallDroppable,
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
            destination: smallDroppable,
          })).toBe(true);
        });
      });
    });

    describe('with changes in droppable scroll', () => {
      const frame: Spacing = {
        top: 10,
        left: 10,
        right: 100,
        // cuts the droppable short
        bottom: 100,
      };
      const clippedDroppable: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'clipped',
          type: 'TYPE',
        },
        client: getArea({
          ...frame,
          // stretches out past frame
          bottom: 600,
        }),
        frameClient: getArea(frame),
      });

      describe('originally invisible but now invisible', () => {
        it('should take into account the droppable scroll when detecting visibility', () => {
          const originallyInvisible: Spacing = {
            ...frame,
            top: 110,
            bottom: 200,
          };

          // originally invisible
          expect(isPartiallyVisible({
            target: originallyInvisible,
            destination: clippedDroppable,
            viewport,
          })).toBe(false);

          // after scroll the target is now visible
          expect(isPartiallyVisible({
            target: originallyInvisible,
            destination: scrollDroppable(clippedDroppable, { x: 0, y: 100 }),
            viewport,
          })).toBe(true);
        });
      });

      describe('originally visible but now visible', () => {
        it('should take into account the droppable scroll when detecting visibility', () => {
          const originallyVisible: Spacing = {
            ...frame,
            top: 10,
            bottom: 20,
          };

          // originally visible
          expect(isPartiallyVisible({
            target: originallyVisible,
            destination: clippedDroppable,
            viewport,
          })).toBe(true);

          // after scroll the target is now invisible
          expect(isPartiallyVisible({
            target: originallyVisible,
            destination: scrollDroppable(clippedDroppable, { x: 0, y: 100 }),
            viewport,
          })).toBe(false);
        });
      });
    });
  });

  describe('viewport + droppable', () => {
    it('should return true if visible in the viewport and the droppable', () => {
      expect(isPartiallyVisible({
        target: inViewport1,
        viewport,
        destination: smallDroppable,
      })).toBe(true);
    });

    it('should return false if not visible in the droppable even if visible in the viewport', () => {
      expect(isPartiallyVisible({
        target: inViewport2,
        viewport,
        destination: smallDroppable,
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
        destination: notVisibleDroppable,
      })).toBe(false);
    });
  });
});
