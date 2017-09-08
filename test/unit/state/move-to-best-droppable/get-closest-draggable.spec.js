// @flow
import getClosestDraggable from '../../../../src/state/move-to-best-droppable/get-closest-draggable';
import { getDroppableDimension, getDraggableDimension } from '../../../../src/state/dimension';
import { add, distance, patch } from '../../../../src/state/position';
import { horizontal, vertical } from '../../../../src/state/axis';
import getClientRect from '../../../utils/get-client-rect';
import type {
  Axis,
  Position,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../../../src/types';

describe('get closest draggable', () => {
  [vertical, horizontal].forEach((axis: Axis) => {
    const start: number = 0;
    const end: number = 100;
    const crossAxisStart: number = 0;
    const crossAxisEnd: number = 20;

    const droppable: DroppableDimension = getDroppableDimension({
      id: 'droppable',
      clientRect: getClientRect({
        [axis.start]: start,
        [axis.end]: end,
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
      }),
    });

    // first item bleeds backwards past the start of the droppable
    const partialHiddenBackwards: DraggableDimension = getDraggableDimension({
      id: 'bleedsOverStart',
      droppableId: droppable.id,
      clientRect: getClientRect({
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: -10, // -10
        [axis.end]: 20,
      }),
    });

    const visible1: DraggableDimension = getDraggableDimension({
      id: 'visible1',
      droppableId: droppable.id,
      clientRect: getClientRect({
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 20,
        [axis.end]: 40,
      }),
    });

    const visible2: DraggableDimension = getDraggableDimension({
      id: 'visible2',
      droppableId: droppable.id,
      clientRect: getClientRect({
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 40,
        [axis.end]: 60,
      }),
    });

    // bleeds over the end of the visible boundary
    const partiallyHiddenForwards: DraggableDimension = getDraggableDimension({
      id: 'bleedsOverEnd',
      droppableId: droppable.id,
      clientRect: getClientRect({
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 60,
        [axis.end]: 120,
      }),
    });

    // totally invisible
    const hidden: DraggableDimension = getDraggableDimension({
      id: 'hidden',
      droppableId: droppable.id,
      clientRect: getClientRect({
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 120,
        [axis.end]: 140,
      }),
    });

    const draggables: DraggableDimensionMap = {
      [partialHiddenBackwards.id]: partialHiddenBackwards,
      [visible1.id]: visible1,
      [visible2.id]: visible2,
      [partiallyHiddenForwards.id]: partiallyHiddenForwards,
      [hidden.id]: hidden,
    };

    it('should return the closest draggable', () => {
      // closet to visible1
      const center1: Position = patch(
        axis.line, visible1.page.withoutMargin.center[axis.line], 100
      );
      const result1: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center1,
        destination: droppable,
        draggables,
      });
      expect(result1).toBe(visible1);

      // closest to visible2
      const center2: Position = patch(
        axis.line, visible2.page.withoutMargin.center[axis.line], 100
      );
      const result2: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center2,
        destination: droppable,
        draggables,
      });
      expect(result2).toBe(visible2);
    });

    it('should return null if there are no draggables in the droppable', () => {
      const center: Position = {
        x: 100,
        y: 100,
      };
      const empty: DraggableDimensionMap = {};

      const result: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center,
        destination: droppable,
        draggables: empty,
      });

      expect(result).toBe(null);
    });

    describe('removal of draggables that are not entirely within the current visible bounds of a droppable', () => {
      it('should remove draggables that have backwards partial visiblility', () => {
        // point would usually be closest to visible1 -
        // but it is outside of the visible bounds of the droppable
        const center: Position = patch(
          axis.line, partialHiddenBackwards.page.withoutMargin.center[axis.line], 100
        );

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables,
        });

        expect(result).toBe(visible1);
      });

      it('should remove draggables that have forward partial visiblility', () => {
        const center: Position = patch(
          axis.line, partiallyHiddenForwards.page.withoutMargin.center[axis.line], 100
        );

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables,
        });

        expect(result).toBe(visible2);
      });

      it('should remove draggables that have no visiblity', () => {
        const center: Position = patch(
          axis.line, hidden.page.withoutMargin.center[axis.line], 100
        );

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables,
        });

        expect(result).toBe(visible2);
      });

      it('should return null if there are no visible targets', () => {
        const notVisible: DraggableDimensionMap = {
          [partialHiddenBackwards.id]: partialHiddenBackwards,
          [partiallyHiddenForwards.id]: partiallyHiddenForwards,
          [hidden.id]: hidden,
        };
        const center: Position = {
          x: 0,
          y: 0,
        };

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables: notVisible,
        });

        expect(result).toBe(null);
      });
    });

    it('should return the draggable that is first on the main axis in the event of a tie', () => {
      // in this case the distance between visible1 and visible2 is the same
      const center: Position = patch(
        axis.line,
        // this is shared edge
        visible2.page.withoutMargin[axis.start],
        100
      );

      const result: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center,
        destination: droppable,
        draggables,
      });

      expect(result).toBe(visible1);

    // validating test assumptions

      // 1. that they have equal distances
      expect(distance(center, visible1.page.withoutMargin.center))
      .toEqual(distance(center, visible2.page.withoutMargin.center));

      // 2. if we move beyond the edge visible2 will be selected
      const result2: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: add(center, patch(axis.line, 1)),
        destination: droppable,
        draggables,
      });
      expect(result2).toBe(visible2);
    });
  });
});
