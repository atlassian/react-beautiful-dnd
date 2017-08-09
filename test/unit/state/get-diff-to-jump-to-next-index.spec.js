// @flow
import getDiffToJumpToNextIndex from '../../../src/state/get-diff-to-jump-to-next-index';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import getClientRect from '../../utils/get-client-rect';
import type {
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableLocation,
  Position,
} from '../../../src/types';

const droppableId: DroppableId = 'drop-1';

const droppable: DroppableDimension = getDroppableDimension({
  id: droppableId,
  clientRect: getClientRect({
    top: 0,
    left: 0,
    bottom: 1000,
    right: 100,
  }),
});

// height: 100
const draggable1: DraggableDimension = getDraggableDimension({
  id: 'draggable1',
  droppableId,
  clientRect: getClientRect({
    top: 0,
    left: 10,
    bottom: 100,
    right: 90,
  }),
});

// height: 199
const draggable2: DraggableDimension = getDraggableDimension({
  id: 'draggable2',
  droppableId,
  clientRect: getClientRect({
    top: 101,
    left: 10,
    bottom: 300,
    right: 90,
  }),
});

// height: 299
const draggable3: DraggableDimension = getDraggableDimension({
  id: 'draggable3',
  droppableId,
  clientRect: getClientRect({
    top: 301,
    left: 10,
    bottom: 600,
    right: 90,
  }),
});

const droppables: DroppableDimensionMap = {
  [droppable.id]: droppable,
};

const draggables: DraggableDimensionMap = {
  [draggable1.id]: draggable1,
  [draggable2.id]: draggable2,
  [draggable3.id]: draggable3,
};

describe('jump to next index', () => {
  describe('jump forward', () => {
    it('should return null if cannot move forward', () => {
      const location: DraggableLocation = {
        index: 2,
        droppableId: droppable.id,
      };

      const point: ?Position = getDiffToJumpToNextIndex({
        isMovingForward: true,
        draggableId: draggable3.id,
        location,
        draggables,
        droppables,
      });

      expect(point).toBe(null);
    });

    describe('is moving toward start position', () => {
      it('should return the height of the dimension in the current index', () => {
        // dragging the second item (draggable2), which has previously
        // been moved backwards and is now in the first position
        const currentIndex = 0;
        const location: DraggableLocation = {
          index: currentIndex,
          droppableId: droppable.id,
        };
        const expected: Position = {
          x: 0,
          y: draggable1.page.withMargin.height,
        };

        const result: ?Position = getDiffToJumpToNextIndex({
          isMovingForward: true,
          draggableId: draggable2.id,
          location,
          draggables,
          droppables,
        });

        expect(result).toEqual(expected);
      });
    });

    describe('is moving away from start position', () => {
      describe('dragging first item forward one position', () => {
        it('should return the height of the second dimension', () => {
          // dragging the first item
          const location: DraggableLocation = {
            index: 0,
            droppableId: droppable.id,
          };
          const expected: Position = {
            x: 0,
            y: draggable2.page.withMargin.height,
          };

          const result: ?Position = getDiffToJumpToNextIndex({
            isMovingForward: true,
            draggableId: draggable1.id,
            location,
            draggables,
            droppables,
          });

          expect(result).toEqual(expected);
        });
      });

      describe('dragging second item forward one position', () => {
        it('should return the height of the third dimension', () => {
          // dragging the second item
          const location: DraggableLocation = {
            index: 1,
            droppableId: droppable.id,
          };
          const expected: Position = {
            x: 0,
            y: draggable3.page.withMargin.height,
          };

          const result: ?Position = getDiffToJumpToNextIndex({
            isMovingForward: true,
            draggableId: draggable2.id,
            location,
            draggables,
            droppables,
          });

          expect(result).toEqual(expected);
        });
      });

      describe('dragging first item forward one position after already moving it forward once', () => {
        it('should return the height of the third dimension', () => {
          // draggable1 is now in position 2 (index 1) after a first drag
          const location: DraggableLocation = {
            index: 1,
            droppableId: droppable.id,
          };
          // next dimension from the current index is draggable3
          const expected: Position = {
            x: 0,
            y: draggable3.page.withMargin.height,
          };

          const result: ?Position = getDiffToJumpToNextIndex({
            isMovingForward: true,
            draggableId: draggable1.id,
            location,
            draggables,
            droppables,
          });

          expect(result).toEqual(expected);
        });
      });
    });
  });

  describe('jump backward', () => {
    it('should return null if cannot move backward', () => {
      const location: DraggableLocation = {
        index: 0,
        droppableId: droppable.id,
      };

      const point: ?Position = getDiffToJumpToNextIndex({
        isMovingForward: false,
        draggableId: draggable1.id,
        location,
        draggables,
        droppables,
      });

      expect(point).toBe(null);
    });

    describe('is moving toward start position', () => {
      it('should return the height of the dimension in the current index', () => {
        // dragged the second item (draggable2) forward once, and is now
        // moving backwards towards the start again
        const location: DraggableLocation = {
          // now in the third position
          index: 2,
          droppableId: droppable.id,
        };
        const expected: Position = {
          x: 0,
          y: -draggable3.page.withMargin.height,
        };

        const point: ?Position = getDiffToJumpToNextIndex({
          isMovingForward: false,
          draggableId: draggable2.id,
          location,
          draggables,
          droppables,
        });

        expect(point).toEqual(expected);
      });
    });

    describe('is moving away from start position', () => {
      describe('dragging the second item back to the first position', () => {
        it('should return the negative of the height of the item in the first position', () => {
          const location: DraggableLocation = {
            index: 1,
            droppableId: droppable.id,
          };
          const expected: Position = {
            x: 0,
            y: -draggable1.page.withMargin.height,
          };

          const point: ?Position = getDiffToJumpToNextIndex({
            isMovingForward: false,
            draggableId: draggable2.id,
            location,
            draggables,
            droppables,
          });

          expect(point).toEqual(expected);
        });
      });

      describe('dragging the third item back to the second position', () => {
        it('should return the negative of the height of the item in the second position', () => {
          const location: DraggableLocation = {
            index: 2,
            droppableId: droppable.id,
          };
          const expected: Position = {
            x: 0,
            y: -draggable2.page.withMargin.height,
          };

          const point: ?Position = getDiffToJumpToNextIndex({
            isMovingForward: false,
            draggableId: draggable3.id,
            location,
            draggables,
            droppables,
          });

          expect(point).toEqual(expected);
        });
      });
    });
  });
});
