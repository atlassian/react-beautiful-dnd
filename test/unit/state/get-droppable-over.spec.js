// @flow
import getDroppableOver from '../../../src/state/get-droppable-over';
import { getPreset, disableDroppable, getDroppableDimension, getDraggableDimension } from '../../utils/dimension';
import { scrollDroppable } from '../../../src/state/droppable-dimension';
import type {
  Rect,
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  Spacing,
  DroppableId,
  Position,
} from '../../../src/types';

const preset = getPreset();

// Most functionality is tested by get get\InsideDimension
describe('get droppable over', () => {
  it('should return null if the target is not over any dimension', () => {
    const target: Position = {
      x: 100000,
      y: 100000,
    };

    const result: ?DroppableId = getDroppableOver({
      target,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousDroppableOverId: null,
    });

    expect(result).toBe(null);
  });

  it('should return the id of the droppable that the target is over', () => {
    Object.keys(preset.draggables).forEach((id: DraggableId) => {
      const draggable: DraggableDimension = preset.draggables[id];

      const result: ?DroppableId = getDroppableOver({
        target: draggable.page.borderBox.center,
        draggable,
        draggables: preset.draggables,
        droppables: preset.droppables,
        previousDroppableOverId: null,
      });

      expect(result).toBe(draggable.descriptor.droppableId);
    });
  });

  it('should ignore droppables that are disabled', () => {
    const target: Position = preset.inHome1.page.borderBox.center;
    const withDisabled: DroppableDimensionMap = {
      ...preset.droppables,
      [preset.home.descriptor.id]: disableDroppable(preset.home),
    };

    const whileEnabled: ?DroppableId = getDroppableOver({
      target,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: preset.droppables,
      previousDroppableOverId: null,
    });
    const whileDisabled: ?DroppableId = getDroppableOver({
      target,
      draggable: preset.inHome1,
      draggables: preset.draggables,
      droppables: withDisabled,
      previousDroppableOverId: null,
    });

    expect(whileEnabled).toBe(preset.home.descriptor.id);
    expect(whileDisabled).toBe(null);
  });

  it('should ignore droppables that are partially hidden by their frames', () => {
    const droppable: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'partially hidden subject',
        type: 'TYPE',
      },
      borderBox: {
        top: 0, left: 0, right: 100, bottom: 100,
      },
      closest: {
        // will partially hide the subject
        borderBox: {
          top: 0, left: 0, right: 50, bottom: 100,
        },
        scrollHeight: 100,
        scrollWidth: 100,
        scroll: { x: 0, y: 0 },
        shouldClipSubject: true,
      },
    });
    const draggable: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'draggable',
        droppableId: droppable.descriptor.type,
        index: 0,
      },
      borderBox: {
        top: 0, left: 0, right: 50, bottom: 50,
      },
    });

    const result: ?DroppableId = getDroppableOver({
      // over the hidden part of the droppable subject
      target: { x: 60, y: 50 },
      draggable,
      draggables: { [draggable.descriptor.id]: draggable },
      droppables: { [droppable.descriptor.id]: droppable },
      previousDroppableOverId: null,
    });

    expect(result).toBe(null);
  });

  it('should ignore droppables that are totally hidden by their frames', () => {
    const droppable: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'hidden subject',
        type: 'TYPE',
      },
      borderBox: {
        top: 0, left: 0, right: 100, bottom: 100,
      },
      closest: {
        // will partially hide the subject
        // will totally hide the subject
        borderBox: {
          top: 0, left: 101, right: 200, bottom: 100,
        },
        scrollHeight: 100,
        scrollWidth: 200,
        scroll: { x: 0, y: 0 },
        shouldClipSubject: true,
      },
    });
    const draggable: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'draggable',
        droppableId: droppable.descriptor.type,
        index: 0,
      },
      borderBox: {
        top: 0, left: 0, right: 50, bottom: 50,
      },
    });

    const result: ?DroppableId = getDroppableOver({
      target: { x: 50, y: 50 },
      draggable,
      draggables: { [draggable.descriptor.id]: draggable },
      droppables: { [droppable.descriptor.id]: droppable },
      previousDroppableOverId: null,
    });

    expect(result).toBe(null);
  });

  describe('placeholder buffer', () => {
    const margin: Spacing = {
      top: 10, right: 10, bottom: 10, left: 10,
    };
    const borderBox: Spacing = {
      top: 10,
      left: 10,
      right: 90,
      bottom: 90,
    };
    const home: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'home',
        type: 'TYPE',
      },
      borderBox,
      margin,
    });
    const inHome1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'in-home-1',
        droppableId: home.descriptor.id,
        index: 0,
      },
      borderBox: {
        top: 10,
        left: 10,
        right: 90,
        // almost takes up the whole droppable
        bottom: 80,
      },
      margin,
    });
    const inForeign1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'in-foreign-1',
        droppableId: 'foreign',
        index: 0,
      },
      borderBox: {
        // to the right of inHome1
        left: 200,
        right: 250,
        // initially the same vertically
        top: 10,
        // almost takes up the whole droppable
        bottom: 80,
      },
      margin,
    });
    const draggables: DraggableDimensionMap = {
      [inHome1.descriptor.id]: inHome1,
      [inForeign1.descriptor.id]: inForeign1,
    };
    const droppables: DroppableDimensionMap = {
      [home.descriptor.id]: home,
    };

    describe('is dragging over nothing', () => {
      it('should not add any placeholder buffer', () => {
        const target: Position = {
          x: 10000,
          y: 10000,
        };
        // dragging inForeign1 just below inHome1
        const result: ?DroppableId = getDroppableOver({
          target,
          draggable: inForeign1,
          draggables,
          droppables,
          previousDroppableOverId: null,
        });

        expect(result).toBe(null);
      });
    });

    describe('is dragging over home droppable', () => {
      it('should not add any placeholder buffer', () => {
        // just below home
        const target: Position = {
          x: home.page.marginBox.center.x,
          y: home.page.marginBox.bottom + 1,
        };
        // dragging inHome1 just below home
        const result: ?DroppableId = getDroppableOver({
          target,
          draggable: inHome1,
          draggables,
          droppables,
          previousDroppableOverId: null,
        });

        expect(result).toBe(null);
      });
    });

    describe('over foreign droppable', () => {
      describe('droppable has no scroll container', () => {
        it('should not add a buffer if it was not previously over the foreign droppable', () => {
          // just below home
          const target: Position = {
            x: home.page.marginBox.center.x,
            y: home.page.marginBox.bottom + 1,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: null,
          });

          expect(result).toBe(null);
        });

        it('should add a placeholder buffer when previously dragging over', () => {
          // just below home
          const target: Position = {
            x: home.page.marginBox.center.x,
            y: home.page.marginBox.bottom + 1,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: home.descriptor.id,
          });

          expect(result).toBe(home.descriptor.id);
        });

        it('should add as much space as required to fit a placeholder', () => {
          // at the end of the placeholder
          const target: Position = {
            x: inHome1.page.marginBox.center.x,
            y: inHome1.page.marginBox.bottom + inForeign1.page.marginBox.bottom,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: home.descriptor.id,
          });

          expect(result).toBe(home.descriptor.id);
        });

        it('should not extend beyond what is required to fit a placeholder', () => {
          const target: Position = {
            x: inHome1.page.marginBox.center.x,
            y: inHome1.page.marginBox.bottom + inForeign1.page.marginBox.bottom + 1,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: home.descriptor.id,
          });

          expect(result).toBe(null);
        });

        it('should only add buffer on main axis', () => {
          const target: Position = {
            // too far to the right
            x: inHome1.page.marginBox.right + 1,
            // would otherwise be fine
            y: inHome1.page.marginBox.bottom + inForeign1.page.marginBox.bottom,
          };

          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables,
            previousDroppableOverId: home.descriptor.id,
          });

          expect(result).toBe(null);
        });

        describe('empty droppable', () => {
          it('should add required space to an empty droppable', () => {
            const empty: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'empty',
                type: 'TYPE',
              },
              borderBox: {
                top: 1000,
                left: 1000,
                right: 2000,
                // not big enough to fit inHome1
                bottom: 1000 + (inHome1.page.marginBox.height / 2),
              },
            });
            const target: Position = {
              x: empty.page.marginBox.center.x,
              y: 1000 + inHome1.page.marginBox.height,
            };
            const withEmpty: DroppableDimensionMap = {
              ...droppables,
              [empty.descriptor.id]: empty,
            };

            const result: ?DroppableId = getDroppableOver({
              target,
              draggable: inForeign1,
              draggables,
              droppables: withEmpty,
              previousDroppableOverId: empty.descriptor.id,
            });

            expect(result).toBe(empty.descriptor.id);

            // validating that without previously being dragged over it
            // would not have added the placeholder buffer
            // This is to check that our math is correct

            const validation: ?DroppableId = getDroppableOver({
              target,
              draggable: inForeign1,
              draggables,
              droppables: withEmpty,
              // not previous dragged over
              previousDroppableOverId: null,
            });

            expect(validation).toBe(null);
          });

          it('should not add any space to an empty droppable if it is not needed', () => {
            const empty: DroppableDimension = getDroppableDimension({
              descriptor: {
                id: 'empty',
                type: 'TYPE',
              },
              borderBox: {
                top: 1000,
                left: 1000,
                right: 2000,
                // big enough to fit inHome1
                bottom: 1000 + inHome1.page.marginBox.height,
              },
            });
            const target: Position = {
              x: empty.page.marginBox.center.x,
              y: 1000 + inHome1.page.marginBox.height,
            };
            const withEmpty: DroppableDimensionMap = {
              ...droppables,
              [empty.descriptor.id]: empty,
            };

            const result: ?DroppableId = getDroppableOver({
              target,
              draggable: inForeign1,
              draggables,
              droppables: withEmpty,
              previousDroppableOverId: empty.descriptor.id,
            });

            expect(result).toBe(empty.descriptor.id);

            // validating that no growth has actually occurred

            const newTarget: Position = {
              x: target.x,
              y: target.y + 1,
            };

            const validation: ?DroppableId = getDroppableOver({
              target: newTarget,
              draggable: inForeign1,
              draggables,
              droppables: withEmpty,
              // not previous dragged over
              previousDroppableOverId: null,
            });

            expect(validation).toBe(null);
          });
        });
      });

      describe('droppable has scroll container', () => {
        it('should not a placeholder buffer to the frame', () => {
          const custom: DroppableDimension = getDroppableDimension({
            descriptor: {
              id: 'has-a-scroll-parent',
              type: 'TYPE',
            },
            borderBox: {
              top: 0,
              left: 0,
              right: 100,
              // cut off by the frame
              bottom: 120,
            },
            closest: {
              borderBox: {
                top: 0,
                left: 0,
                right: 100,
                bottom: 100,
              },
              scrollHeight: 120,
              scrollWidth: 100,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });
          // scrolling custom down so that it the bottom is visible
          const scrolled: DroppableDimension = scrollDroppable(custom, { x: 0, y: 20 });

          const withCustom: DroppableDimensionMap = {
            ...droppables,
            [custom.descriptor.id]: scrolled,
          };
          // just below frame
          // normally cut off by frame
          const target: Position = {
            x: 0,
            y: 101,
          };
          // dragging inForeign1 just below inHome1
          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inForeign1,
            draggables,
            droppables: withCustom,
            previousDroppableOverId: custom.descriptor.id,
          });

          expect(result).toBe(null);
        });

        it('should consider any changes in the droppables scroll', () => {
          const foreign: DroppableDimension = getDroppableDimension({
            descriptor: {
              id: 'my-custom-foreign',
              type: 'TYPE',
            },
            borderBox: {
              top: 0,
              left: 0,
              right: 100,
              // this will ensure that there is required growth in the droppable
              bottom: inHome1.page.marginBox.height - 1,
            },
            closest: {
              borderBox: {
                top: 0,
                left: 0,
                right: 100,
                // currently much bigger than client
                bottom: 500,
              },
              scrollWidth: 100,
              scrollHeight: 500,
              scroll: { x: 0, y: 0 },
              shouldClipSubject: true,
            },
          });
          const scrolled: DroppableDimension = scrollDroppable(foreign, { x: 0, y: 50 });
          const clippedMarginBox: ?Rect = scrolled.viewport.clippedMarginBox;

          if (clippedMarginBox == null) {
            throw new Error('invalid test setup');
          }

          // Just below clipped area
          // the buffer should be added to this area
          const target: Position = {
            x: clippedMarginBox.center.x,
            y: clippedMarginBox.bottom + 1,
          };

          const result: ?DroppableId = getDroppableOver({
            target,
            draggable: inHome1,
            draggables,
            droppables: { [scrolled.descriptor.id]: scrolled },
            previousDroppableOverId: scrolled.descriptor.id,
          });

          expect(result).toBe(scrolled.descriptor.id);
        });
      });
    });
  });
});
