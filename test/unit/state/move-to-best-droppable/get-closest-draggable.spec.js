// @flow
import getClosestDraggable from '../../../../src/state/move-to-best-droppable/get-closest-draggable';
import { getDroppableDimension, getDraggableDimension } from '../../../../src/state/dimension';
import { add, distance } from '../../../../src/state/position';
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
  describe('on axis axis', () => {
    const axis: Axis = vertical;

    const droppable: DroppableDimension = getDroppableDimension({
      id: 'droppable',
      clientRect: getClientRect({
        top: 0,
        left: 0,
        bottom: 100,
        right: 20,
      }),
    });

    // first item is partially hidden on the top
    const partialHiddenUpper: DraggableDimension = getDraggableDimension({
      id: 'partialHiddenUpper',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top: -10,
        left: 0,
        bottom: 20,
        right: 20,
      }),
    });

    const visible1: DraggableDimension = getDraggableDimension({
      id: 'visible1',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top: 20,
        left: 0,
        bottom: 40,
        right: 20,
      }),
    });

    const visible2: DraggableDimension = getDraggableDimension({
      id: 'visible2',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top: 40,
        left: 0,
      // same height as visible1
        bottom: 60,
        right: 20,
      }),
    });

    // bleeds over the visible boundary
    const partiallyHiddenLower: DraggableDimension = getDraggableDimension({
      id: 'partiallyHiddenLower',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top: 60,
        left: 0,
        bottom: 120,
        right: 20,
      }),
    });

    // totally invisible
    const hidden: DraggableDimension = getDraggableDimension({
      id: 'hidden',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top: 90,
        left: 0,
        bottom: 120,
        right: 20,
      }),
    });

    const draggables: DraggableDimensionMap = {
      [partialHiddenUpper.id]: partialHiddenUpper,
      [visible1.id]: visible1,
      [visible2.id]: visible2,
      [partiallyHiddenLower.id]: partiallyHiddenLower,
      [hidden.id]: hidden,
    };

    it('should return the closest draggable', () => {
      const center1: Position = {
        x: 100,
        y: visible1.page.withoutMargin.center.y,
      };
      const result1: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center1,
        destination: droppable,
        draggables,
      });
      expect(result1).toBe(visible1);

    // closest to second
      const center2: Position = {
        x: 100,
        y: visible1.page.withoutMargin.center.y,
      };
      const result2: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center2,
        destination: droppable,
        draggables,
      });
      expect(result2).toBe(visible1);
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
      it('should remove draggables that have upper partial visiblility', () => {
      // point would usually be closest to first -
      // but it is outside of the visible bounds of the droppable
        const center: Position = {
          x: 100,
          y: partialHiddenUpper.page.withoutMargin.center.y,
        };

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables,
        });

        expect(result).toBe(visible1);
      });

      it('should remove draggables that have lower partial visiblility', () => {
        const center: Position = {
          x: 100,
          y: partiallyHiddenLower.page.withoutMargin.center.y,
        };

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables,
        });

        expect(result).toBe(visible2);
      });

      it('should remove draggables that have no visiblity', () => {
        const center: Position = {
          x: 100,
          y: hidden.page.withoutMargin.center.y,
        };

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
          [partialHiddenUpper.id]: partialHiddenUpper,
          [partiallyHiddenLower.id]: partiallyHiddenLower,
          [hidden.id]: hidden,
        };
        const center: Position = {
          x: 100,
          y: 100,
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
      const center: Position = {
        x: 100,
      // this is a shared edge
        y: visible2.page.withoutMargin.top,
      };

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
        pageCenter: add(center, { x: 0, y: 1 }),
        destination: droppable,
        draggables,
      });
      expect(result2).toBe(visible2);
    });
  });

  describe('on horizontal axis', () => {
    const axis: Axis = horizontal;
    const bottom: number = 20;
    const top: number = 10;

    const droppable: DroppableDimension = getDroppableDimension({
      id: 'droppable',
      clientRect: getClientRect({
        top,
        bottom,
        left: 0,
        right: 100,
      }),
    });

    // first item is partially hidden on the top
    const partialHiddenBackwards: DraggableDimension = getDraggableDimension({
      id: 'partialHiddenBackwards',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top,
        bottom,
        left: -10,
        right: 20,
      }),
    });

    const visible1: DraggableDimension = getDraggableDimension({
      id: 'visible1',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top,
        bottom,
        left: 20,
        right: 40,
      }),
    });

    const visible2: DraggableDimension = getDraggableDimension({
      id: 'visible2',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top,
        bottom,
        left: 40,
        right: 60,
      }),
    });

    // bleeds over the visible boundary
    const partiallyHiddenForward: DraggableDimension = getDraggableDimension({
      id: 'partiallyHiddenForward',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top,
        bottom,
        left: 60,
        right: 120,
      }),
    });

    // totally invisible
    const hidden: DraggableDimension = getDraggableDimension({
      id: 'hidden',
      droppableId: droppable.id,
      clientRect: getClientRect({
        top,
        bottom,
        left: 120,
        right: 140,
      }),
    });

    const draggables: DraggableDimensionMap = {
      [partialHiddenBackwards.id]: partialHiddenBackwards,
      [visible1.id]: visible1,
      [visible2.id]: visible2,
      [partiallyHiddenForward.id]: partiallyHiddenForward,
      [hidden.id]: hidden,
    };

    it('should return the closest draggable', () => {
      const center1: Position = {
        y: 100,
        x: visible1.page.withoutMargin.center.x,
      };
      const result1: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center1,
        destination: droppable,
        draggables,
      });
      expect(result1).toBe(visible1);

      // closest to second
      const center2: Position = {
        y: 100,
        x: visible1.page.withoutMargin.center.x,
      };
      const result2: ?DraggableDimension = getClosestDraggable({
        axis,
        pageCenter: center2,
        destination: droppable,
        draggables,
      });
      expect(result2).toBe(visible1);
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
      // point would usually be closest to first -
      // but it is outside of the visible bounds of the droppable
        const center: Position = {
          y: 100,
          x: partialHiddenBackwards.page.withoutMargin.center.x,
        };

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables,
        });

        expect(result).toBe(visible1);
      });

      it('should remove draggables that have forward partial visiblility', () => {
        const center: Position = {
          y: 100,
          x: partiallyHiddenForward.page.withoutMargin.center.x,
        };

        const result: ?DraggableDimension = getClosestDraggable({
          axis,
          pageCenter: center,
          destination: droppable,
          draggables,
        });

        expect(result).toBe(visible2);
      });

      it('should remove draggables that have no visiblity', () => {
        const center: Position = {
          y: 100,
          x: hidden.page.withoutMargin.center.x,
        };

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
          [partiallyHiddenForward.id]: partiallyHiddenForward,
          [hidden.id]: hidden,
        };
        const center: Position = {
          x: 100,
          y: 100,
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
      const center: Position = {
        y: 100,
        // this is a shared edge
        x: visible2.page.withoutMargin.left,
      };

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
        pageCenter: add(center, { x: 1, y: 0 }),
        destination: droppable,
        draggables,
      });
      expect(result2).toBe(visible2);
    });
  });
});
