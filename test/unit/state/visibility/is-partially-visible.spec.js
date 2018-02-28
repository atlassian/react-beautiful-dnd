// @flow
import getArea from '../../../../src/state/get-area';
import { isPartiallyVisible } from '../../../../src/state/visibility/is-visible';
import { getDroppableDimension, scrollDroppable } from '../../../../src/state/dimension';
import { offsetByPosition } from '../../../../src/state/spacing';
import { getClosestScrollable } from '../../../utils/dimension';
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
  paddingBox: viewport,
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

const asBigAsInViewport1: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'subset',
    type: 'TYPE',
  },
  paddingBox: getArea(inViewport1),
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
          offsetByPosition(viewport, { x: 0, y: -1 }),
          // bleed over right
          offsetByPosition(viewport, { x: 1, y: 0 }),
          // bleed over bottom
          offsetByPosition(viewport, { x: 0, y: 1 }),
          // bleed over left
          offsetByPosition(viewport, { x: -1, y: 0 }),
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
        paddingBox: getArea({
          top: viewport.top,
          // stretches out the bottom of the viewport
          bottom: viewport.bottom + 100,
          left: viewport.left,
          right: viewport.right,
        }),
        closest: {
          frameClient: viewport,
          scrollWidth: viewport.width,
          scrollHeight: viewport.bottom + 100,
          scroll: { x: 0, y: 0 },
          shouldClipSubject: true,
        },
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
    const paddingBox: Area = getArea({
      top: 0,
      left: 0,
      right: 600,
      bottom: 600,
    });
    const frame: Area = getArea({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    });

    const scrollable: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'clipped',
        type: 'TYPE',
      },
      paddingBox,
      closest: {
        frameClient: frame,
        scrollHeight: paddingBox.height,
        scrollWidth: paddingBox.width,
        scroll: { x: 0, y: 0 },
        shouldClipSubject: true,
      },
    });

    describe('without changes in droppable scroll', () => {
      it('should return false if outside the droppable', () => {
        expect(isPartiallyVisible({
          target: inViewport2,
          viewport,
          destination: asBigAsInViewport1,
        })).toBe(false);
      });

      it('should return true if the target is bigger than the droppable', () => {
        expect(isPartiallyVisible({
          target: viewport,
          viewport,
          destination: asBigAsInViewport1,
        })).toBe(true);
      });

      it('should return true if the same size of the droppable', () => {
        expect(isPartiallyVisible({
          target: inViewport1,
          viewport,
          destination: asBigAsInViewport1,
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
          destination: asBigAsInViewport1,
        })).toBe(true);
      });

      it('should return true if partially within the droppable', () => {
        const partials: Spacing[] = [
        // bleed over top
          offsetByPosition(inViewport1, { x: 0, y: -1 }),
          // bleed over right
          offsetByPosition(inViewport1, { x: 1, y: 0 }),
          // bleed over bottom
          offsetByPosition(inViewport1, { x: 0, y: 1 }),
          // bleed over left
          offsetByPosition(inViewport1, { x: -1, y: 0 }),
        ];

        partials.forEach((partial: Spacing) => {
          expect(isPartiallyVisible({
            target: partial,
            viewport,
            destination: asBigAsInViewport1,
          })).toBe(true);
        });
      });

      it('should return false if falling on clipped area of droppable', () => {
        const ourFrame: Spacing = {
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
          paddingBox: getArea({
            ...ourFrame,
            // stretches out past frame
            bottom: 600,
          }),
          closest: {
            frameClient: getArea(ourFrame),
            scrollHeight: 600,
            scrollWidth: getArea(ourFrame).width,
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });
        const inSubjectOutsideFrame: Spacing = {
          ...frame,
          top: 110,
          bottom: 200,
        };

        expect(isPartiallyVisible({
          target: inSubjectOutsideFrame,
          destination: clippedDroppable,
          viewport,
        })).toBe(false);
      });
    });

    describe('with changes in droppable scroll', () => {
      describe('originally invisible but now invisible', () => {
        it('should take into account the droppable scroll when detecting visibility', () => {
          const originallyInvisible: Spacing = {
            left: frame.left,
            right: frame.right,
            top: frame.bottom + 10,
            bottom: frame.bottom + 20,
          };

          // originally invisible
          expect(isPartiallyVisible({
            target: originallyInvisible,
            destination: scrollable,
            viewport,
          })).toBe(false);

          // after scroll the target is now visible
          expect(isPartiallyVisible({
            target: originallyInvisible,
            destination: scrollDroppable(scrollable, { x: 0, y: 100 }),
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
            destination: scrollable,
            viewport,
          })).toBe(true);

          // after scroll the target is now invisible
          expect(isPartiallyVisible({
            target: originallyVisible,
            destination: scrollDroppable(scrollable, { x: 0, y: 100 }),
            viewport,
          })).toBe(false);
        });
      });
    });

    describe('with invisible subject', () => {
      it('should return false when subject is totally invisible', () => {
        // creating a droppable where the frame is bigger than the subject
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: {
            id: 'droppable',
            type: 'TYPE',
          },
          paddingBox: getArea({
            top: 0,
            left: 0,
            bottom: 100,
            right: 100,
          }),
          closest: {
            frameClient: getArea({
              top: 0,
              left: 0,
              bottom: 100,
              right: 100,
            }),
            scrollHeight: 600,
            scrollWidth: 600,
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });

        const originallyVisible: Spacing = {
          ...frame,
          top: 10,
          bottom: 20,
        };

        // originally visible
        expect(isPartiallyVisible({
          target: originallyVisible,
          destination: droppable,
          viewport,
        })).toBe(true);

        // subject is now totally invisible
        const scrolled: DroppableDimension = scrollDroppable(
          droppable,
          getClosestScrollable(droppable).scroll.max,
        );
        // asserting frame is not visible
        expect(scrolled.viewport.clipped).toBe(null);

        // now asserting that this check will fail
        expect(isPartiallyVisible({
          target: originallyVisible,
          destination: scrolled,
          viewport,
        })).toBe(false);
      });
    });
  });

  describe('viewport + droppable', () => {
    it('should return true if visible in the viewport and the droppable', () => {
      expect(isPartiallyVisible({
        target: inViewport1,
        viewport,
        destination: asBigAsInViewport1,
      })).toBe(true);
    });

    it('should return false if not visible in the droppable even if visible in the viewport', () => {
      expect(isPartiallyVisible({
        target: inViewport2,
        viewport,
        destination: asBigAsInViewport1,
      })).toBe(false);
    });

    it('should return false if not visible in the viewport even if visible in the droppable', () => {
      const notVisibleDroppable = getDroppableDimension({
        descriptor: {
          id: 'not-visible',
          type: 'TYPE',
        },
        paddingBox: getArea(notInViewport),
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
