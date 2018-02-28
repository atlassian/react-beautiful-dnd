// @flow
import getClosestDraggable from '../../../../src/state/move-cross-axis/get-closest-draggable';
import { getDroppableDimension, getDraggableDimension, scrollDroppable } from '../../../../src/state/dimension';
import { add, distance, patch } from '../../../../src/state/position';
import { expandByPosition } from '../../../../src/state/spacing';
import { horizontal, vertical } from '../../../../src/state/axis';
import getArea from '../../../../src/state/get-area';
import getViewport from '../../../../src/window/get-viewport';
import type {
  Area,
  Axis,
  Position,
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';

describe('get closest draggable', () => {
  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on the ${axis.direction} axis`, () => {
      const start: number = 0;
      const end: number = 100;
      const crossAxisStart: number = 0;
      const crossAxisEnd: number = 20;

      const paddingBox: Area = getArea({
        [axis.start]: start,
        [axis.end]: end,
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
      });

      const droppable: DroppableDimension = getDroppableDimension({
        descriptor: {
          id: 'droppable',
          type: 'TYPE',
        },
        direction: axis.direction,
        paddingBox,
      });

      const hiddenBackwards: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'hiddenBackwards',
          droppableId: droppable.descriptor.id,
          index: 0,
        },
        paddingBox: getArea({
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: -30, // -10
          [axis.end]: -10,
        }),
      });

      // item bleeds backwards past the start of the droppable
      const partiallyHiddenBackwards: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'partialHiddenBackwards',
          droppableId: droppable.descriptor.id,
          index: 1,
        },
        paddingBox: getArea({
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: -10, // -10
          [axis.end]: 20,
        }),
      });

      const visible1: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'visible1',
          droppableId: droppable.descriptor.id,
          index: 2,
        },
        paddingBox: getArea({
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 20,
          [axis.end]: 40,
        }),
      });

      const visible2: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'visible2',
          droppableId: droppable.descriptor.id,
          index: 3,
        },
        paddingBox: getArea({
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 40,
          [axis.end]: 60,
        }),
      });

      // bleeds over the end of the visible boundary
      const partiallyHiddenForwards: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'partiallyHiddenForwards',
          droppableId: droppable.descriptor.id,
          index: 4,
        },
        paddingBox: getArea({
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 60,
          [axis.end]: 120,
        }),
      });

      // totally invisible
      const hiddenForwards: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'hiddenForwards',
          droppableId: droppable.descriptor.id,
          index: 5,
        },
        paddingBox: getArea({
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: 120,
          [axis.end]: 140,
        }),
      });

      const viewport = getViewport();
      const outOfViewport: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'hidden',
          droppableId: droppable.descriptor.id,
          index: 6,
        },
        paddingBox: getArea({
          [axis.crossAxisStart]: crossAxisStart,
          [axis.crossAxisEnd]: crossAxisEnd,
          [axis.start]: viewport[axis.end] + 1,
          [axis.end]: viewport[axis.end] + 10,
        }),
      });

      const insideDestination: DraggableDimension[] = [
        hiddenBackwards,
        partiallyHiddenBackwards,
        visible1,
        visible2,
        partiallyHiddenForwards,
        hiddenForwards,
        outOfViewport,
      ];

      it('should return the closest draggable', () => {
        // closet to visible1
        const center1: Position = patch(
          axis.line, visible1.page.paddingBox.center[axis.line], 100
        );
        const result1: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center1,
          destination: droppable,
          insideDestination,
        });
        expect(result1).toBe(visible1);

        // closest to visible2
        const center2: Position = patch(
          axis.line, visible2.page.paddingBox.center[axis.line], 100
        );
        const result2: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center2,
          destination: droppable,
          insideDestination,
        });
        expect(result2).toBe(visible2);
      });

      it('should return null if there are no draggables in the droppable', () => {
        const center: Position = {
          x: 100,
          y: 100,
        };

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          insideDestination: [],
        });

        expect(result).toBe(null);
      });

      it('should take into account the change in droppable scroll', () => {
        const scrollable: DroppableDimension = getDroppableDimension({
          descriptor: droppable.descriptor,
          direction: axis.direction,
          paddingBox,
          closest: {
            frameClient: getArea(expandByPosition(paddingBox, patch(axis.line, 100))),
            scrollHeight: paddingBox.width + 100,
            scrollWidth: paddingBox.height + 100,
            scroll: { x: 0, y: 0 },
            shouldClipSubject: true,
          },
        });
        const scrolled: DroppableDimension = scrollDroppable(
          scrollable,
          patch(axis.line, 20)
        );
        const center: Position = patch(
          axis.line,
          visible1.page.paddingBox.center[axis.line],
          100
        );

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: scrolled,
          insideDestination,
        });

        expect(result).toBe(visible2);

        // validation - with no scroll applied we are normally closer to visible1
        const result1: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          insideDestination,
        });
        expect(result1).toBe(visible1);
      });

      describe('removal of draggables that are visible', () => {
        it('should ignore draggables backward that have no total visiblity', () => {
          const center: Position = patch(
            axis.line,
            hiddenBackwards.page.paddingBox.center[axis.line],
            100,
          );

          const result: ?DraggableDimension = getClosestDraggable({
            axis,
            pageCenter: center,
            destination: droppable,
            insideDestination,
          });

          expect(result).toBe(visible1);
        });

        it('should ignore draggables that have backwards partial visiblility', () => {
          const center: Position = patch(
            axis.line,
            partiallyHiddenBackwards.page.paddingBox.center[axis.line],
            100,
          );

          const result: ?DraggableDimension = getClosestDraggable({
            axis,
            pageCenter: center,
            destination: droppable,
            insideDestination,
          });

          expect(result).toBe(visible1);
        });

        it('should ignore draggables that have forward partial visiblility', () => {
          const center: Position = patch(
            axis.line, partiallyHiddenForwards.page.paddingBox.center[axis.line], 100
          );

          const result: ?DraggableDimension = getClosestDraggable({
            axis,
            pageCenter: center,
            destination: droppable,
            insideDestination,
          });

          expect(result).toBe(visible2);
        });

        it('should ignore draggables forward that have no visiblity', () => {
          const center: Position = patch(
            axis.line, hiddenForwards.page.paddingBox.center[axis.line], 100
          );

          const result: ?DraggableDimension = getClosestDraggable({
            axis,
            pageCenter: center,
            destination: droppable,
            insideDestination,
          });

          expect(result).toBe(visible2);
        });

        it('should ignore draggables that are outside of the viewport', () => {
          const center: Position = patch(
            axis.line, outOfViewport.page.paddingBox.center[axis.line], 100
          );

          const result: ?DraggableDimension = getClosestDraggable({
            axis,
            pageCenter: center,
            destination: droppable,
            insideDestination,
          });

          expect(result).toBe(visible2);
        });

        it('should return null if there are no visible targets', () => {
          const notVisible: DraggableDimension[] = [
            hiddenBackwards,
            hiddenForwards,
            outOfViewport,
          ];
          const center: Position = {
            x: 0,
            y: 0,
          };

          const result: ?DraggableDimension = getClosestDraggable({
            axis,
            pageCenter: center,
            destination: droppable,
            insideDestination: notVisible,
          });

          expect(result).toBe(null);
        });
      });

      it('should return the draggable that is first on the main axis in the event of a tie', () => {
        // in this case the distance between visible1 and visible2 is the same
        const center: Position = patch(
          axis.line,
          // this is shared edge
          visible2.page.paddingBox[axis.start],
          100
        );

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          insideDestination,
        });

        expect(result).toBe(visible1);

        // validating test assumptions

        // 1. that they have equal distances
        expect(distance(center, visible1.page.paddingBox.center))
          .toEqual(distance(center, visible2.page.paddingBox.center));

        // 2. if we move beyond the edge visible2 will be selected
        const result2: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: add(center, patch(axis.line, 1)),
          destination: droppable,
          insideDestination,
        });
        expect(result2).toBe(visible2);
      });
    });
  });
});
