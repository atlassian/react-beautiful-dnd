// @flow
import {
  getDraggableDimension,
  getDroppableDimension,
} from '../../../src/state/dimension';
// eslint-disable-next-line no-duplicate-imports
import getDragImpact from '../../../src/state/get-drag-impact';
import noImpact from '../../../src/state/no-impact';
import getClientRect from '../../utils/get-client-rect';
import getDroppableWithDraggables from '../../utils/get-droppable-with-draggables';
import { add, patch } from '../../../src/state/position';
import type {
  WithinDroppable,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
  Position,
} from '../../../src/types';

const droppableId: DroppableId = 'drop-1';
const origin: Position = { x: 0, y: 0 };

describe('get drag impact', () => {
  describe('vertical', () => {
    const droppable: DroppableDimension = getDroppableDimension({
      id: droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }),
    });

    // Making sure the draggables have different heights
    // so that we do not get false positives in the tests

    // height of 9
    const draggable1: DraggableDimension = getDraggableDimension({
      id: 'drag-1',
      droppableId,
      clientRect: getClientRect({
        top: 1,
        left: 10,
        right: 90,
        bottom: 11,
      }),
    });

    // height of 19
    const draggable2: DraggableDimension = getDraggableDimension({
      id: 'drag-2',
      droppableId,
      clientRect: getClientRect({
        top: 11,
        left: 10,
        right: 90,
        bottom: 30,
      }),
    });

    // height of 29
    const draggable3: DraggableDimension = getDraggableDimension({
      id: 'drag-3',
      droppableId,
      clientRect: getClientRect({
        top: 31,
        left: 10,
        right: 90,
        bottom: 60,
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

    it('should return no movement when not dragging over anything', () => {
    // dragging up above the list
      const page: Position = {
        x: droppable.page.withMargin.left,
        y: droppable.page.withMargin.top - 100,
      };

      const withinDroppable: WithinDroppable = {
        center: page,
      };

      const impact: DragImpact = getDragImpact({
        page,
        withinDroppable,
        draggableId: draggable1.id,
        draggables,
        droppables,
      });

      expect(impact).toEqual(noImpact);
    });

    describe('moving forward', () => {
      describe('not moved far enough', () => {
        it('should return the starting position', () => {
        // moving forward - but not enough
          const page: Position = {
            x: draggable2.page.withoutMargin.center.x,
            y: draggable2.page.withoutMargin.center.y + 1,
          };
          const withinDroppable: WithinDroppable = {
            center: page,
          };
          const expected: DragImpact = {
            movement: {
              amount: origin,
              draggables: [],
              isBeyondStartPosition: true,
            },
            direction: 'vertical',
            destination: {
              droppableId: droppable.id,
              index: 1,
            },
          };

          const impact: DragImpact = getDragImpact({
            page,
            withinDroppable,
            draggableId: draggable2.id,
            draggables,
            droppables,
          });

          expect(impact).toEqual(expected);
        });
      });

      describe('moving past one item', () => {
      // moving forward past the top of the next item
        const page: Position = {
          x: draggable1.page.withoutMargin.center.x,
          y: draggable2.page.withoutMargin.top + 1,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable1.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(1);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable1.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable2.id]);
        });
      });

      describe('moving past two items', () => {
      // moving forward past the top of the third item
        const page: Position = {
          x: draggable1.page.withoutMargin.center.x,
          y: draggable3.page.withoutMargin.top + 1,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable1.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(2);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable1.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved (sorted by the closest to the draggables current location)', () => {
          expect(impact.movement.draggables).toEqual([draggable3.id, draggable2.id]);
        });
      });

      describe('moving past one item when the dragging item is not the first in the list', () => {
      // moving the second item forward past the top of the third item
        const page: Position = {
          x: draggable2.page.withoutMargin.center.x,
          y: draggable3.page.withMargin.top + 1,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable2.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(2);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable2.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable3.id]);
        });
      });

      describe('moving past an item due to change in droppable scroll', () => {
      // using the center position of the draggable as the selection point
        const page: Position = draggable1.page.withMargin.center;
        const withinDroppable: WithinDroppable = {
        // just over the top of the second item
          center: {
            x: draggable1.page.withoutMargin.center.x,
            y: draggable2.page.withoutMargin.top + 1,
          },
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable1.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(1);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable1.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable2.id]);
        });
      });
    });

    // same tests as moving forward
    describe('moving backward', () => {
      describe('not moved far enough', () => {
        it('should return the initial location', () => {
        // moving the last item backward - but not enough
          const page: Position = {
            x: draggable3.page.withoutMargin.center.x,
            y: draggable3.page.withoutMargin.center.y - 1,
          };
          const withinDroppable: WithinDroppable = {
            center: page,
          };
          const expected: DragImpact = {
            movement: {
              amount: origin,
              draggables: [],
              isBeyondStartPosition: false,
            },
            direction: 'vertical',
            destination: {
              droppableId: droppable.id,
              index: 2,
            },
          };

          const impact: DragImpact = getDragImpact({
            page,
            withinDroppable,
            draggableId: draggable3.id,
            draggables,
            droppables,
          });

          expect(impact).toEqual(expected);
        });
      });

      describe('moving past one item', () => {
      // moving backward past the bottom of the previous item
        const page: Position = {
          x: draggable3.page.withoutMargin.center.x,
          y: draggable2.page.withoutMargin.bottom - 1,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable3.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(1);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the item being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable3.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable2.id]);
        });
      });

      describe('moving past two items', () => {
      // moving the last item backward past the bottom of the first item
        const page: Position = {
          x: draggable3.page.withoutMargin.center.x,
          y: draggable1.page.withoutMargin.bottom - 1,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable3.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(0);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the items being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable3.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable1.id, draggable2.id]);
        });
      });

      describe('moving past one item when the dragging item is not the last in the list', () => {
      // moving the second item backward past the bottom of the first item
        const page: Position = {
          x: draggable2.page.withoutMargin.center.x,
          y: draggable1.page.withoutMargin.bottom - 1,
        };

        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable2.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(0);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the items being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable2.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable1.id]);
        });
      });

      describe('moving past an item due to change in droppable scroll', () => {
      // using the center position of the draggable as the selection point
        const page: Position = draggable2.page.withMargin.center;
        const withinDroppable: WithinDroppable = {
        // just back past the bottom of the first draggable
          center: {
            x: draggable2.page.withoutMargin.center.x,
            y: draggable1.page.withoutMargin.bottom - 1,
          },
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable2.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
        // Moving from second position to first position
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(0);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the item being moved should move the height of the item being dragged', () => {
          const expected: Position = {
            x: 0,
            y: draggable2.page.withMargin.height,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable1.id]);
        });
      });
    });
  });

  // same tests as vertical - but moving on the horizontal plane
  describe('horizontal', () => {
    const droppable: DroppableDimension = getDroppableDimension({
      id: droppableId,
      direction: 'horizontal',
      clientRect: getClientRect({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      }),
    });

    // Making sure the draggables have different heights
    // so that we do not get false positives in the tests

    // width of 9
    const draggable1: DraggableDimension = getDraggableDimension({
      id: 'drag-1',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 1,
        right: 10,
        bottom: 100,
      }),
    });

    // width of 19
    const draggable2: DraggableDimension = getDraggableDimension({
      id: 'drag-2',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 11,
        right: 30,
        bottom: 100,
      }),
    });

    // width of 29
    const draggable3: DraggableDimension = getDraggableDimension({
      id: 'drag-3',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 31,
        right: 60,
        bottom: 100,
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

    it('should return no movement when not dragging over anything', () => {
      // dragging up above the list
      const page: Position = {
        x: droppable.page.withMargin.left,
        y: droppable.page.withMargin.top - 100,
      };

      const withinDroppable: WithinDroppable = {
        center: page,
      };

      const impact: DragImpact = getDragImpact({
        page,
        withinDroppable,
        draggableId: draggable1.id,
        draggables,
        droppables,
      });

      expect(impact).toEqual(noImpact);
    });

    describe('moving forward', () => {
      describe('not moved far enough', () => {
        it('should return the starting position', () => {
          // moving forward - but not enough
          const page: Position = {
            x: draggable2.page.withoutMargin.center.x + 1,
            y: draggable2.page.withoutMargin.center.y,
          };
          const withinDroppable: WithinDroppable = {
            center: page,
          };
          const expected: DragImpact = {
            movement: {
              amount: origin,
              draggables: [],
              isBeyondStartPosition: true,
            },
            direction: 'horizontal',
            destination: {
              droppableId: droppable.id,
              index: 1,
            },
          };

          const impact: DragImpact = getDragImpact({
            page,
            withinDroppable,
            draggableId: draggable2.id,
            draggables,
            droppables,
          });

          expect(impact).toEqual(expected);
        });
      });

      describe('moving past one item', () => {
        // moving forward past the right of the next item
        const page: Position = {
          x: draggable2.page.withoutMargin.left + 1,
          y: draggable1.page.withoutMargin.center.y,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable1.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid data');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid data');
          }
          expect(impact.destination.index).toBe(1);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable1.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable2.id]);
        });
      });

      describe('moving past two items', () => {
        // moving forward past the left of the third item
        const page: Position = {
          x: draggable3.page.withoutMargin.left + 1,
          y: draggable1.page.withoutMargin.center.y,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable1.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(2);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable1.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved (sorted by closest impacted)', () => {
          expect(impact.movement.draggables).toEqual([draggable3.id, draggable2.id]);
        });
      });

      describe('moving past one item when the dragging item is not the first in the list', () => {
        // moving the second item forward past the left of the third item
        const page: Position = {
          x: draggable3.page.withoutMargin.left + 1,
          y: draggable2.page.withMargin.center.y,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable2.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(2);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable2.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable3.id]);
        });
      });

      describe('moving past an item due to change in droppable scroll', () => {
        // using the center position of the draggable as the selection point
        const page: Position = draggable1.page.withMargin.center;
        const withinDroppable: WithinDroppable = {
          // just over the top of the right item
          center: {
            x: draggable2.page.withoutMargin.right + 1,
            y: draggable1.page.withoutMargin.center.y,
          },
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable1.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(1);
        });

        it('should indicate that the item being move forward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(true);
        });

        it('should indicate that the item being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable1.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable2.id]);
        });
      });
    });

    // same tests as moving forward
    describe('moving backward', () => {
      describe('not moved far enough', () => {
        it('should return the initial location', () => {
          // moving the last item backward - but not enough
          const page: Position = {
            x: draggable3.page.withoutMargin.center.x - 1,
            y: draggable3.page.withoutMargin.center.y,
          };
          const withinDroppable: WithinDroppable = {
            center: page,
          };
          const expected: DragImpact = {
            movement: {
              amount: origin,
              draggables: [],
              isBeyondStartPosition: false,
            },
            direction: 'horizontal',
            destination: {
              droppableId: droppable.id,
              index: 2,
            },
          };

          const impact: DragImpact = getDragImpact({
            page,
            withinDroppable,
            draggableId: draggable3.id,
            draggables,
            droppables,
          });

          expect(impact).toEqual(expected);
        });
      });

      describe('moving past one item', () => {
        // moving backward past the bottom of the previous item
        const page: Position = {
          x: draggable2.page.withoutMargin.right - 1,
          y: draggable2.page.withoutMargin.center.y,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable3.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(1);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the item being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable3.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable2.id]);
        });
      });

      describe('moving past two items', () => {
        // moving the last item backward past the bottom of the first item
        const page: Position = {
          x: draggable1.page.withoutMargin.right - 1,
          y: draggable1.page.withoutMargin.center.y,
        };
        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable3.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(0);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the items being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable3.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved (sorted by closest to the draggables current position)', () => {
          expect(impact.movement.draggables).toEqual([draggable1.id, draggable2.id]);
        });
      });

      describe('moving past one item when the dragging item is not the last in the list', () => {
        // moving the second item backward past the right of the first item
        const page: Position = {
          x: draggable1.page.withoutMargin.right - 1,
          y: draggable1.page.withoutMargin.center.y,
        };

        const withinDroppable: WithinDroppable = {
          center: page,
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable2.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(0);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the items being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable2.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable1.id]);
        });
      });

      describe('moving past an item due to change in droppable scroll', () => {
        // using the center position of the draggable as the selection point
        const page: Position = draggable2.page.withMargin.center;
        const withinDroppable: WithinDroppable = {
          // just back past the bottom of the first draggable
          center: {
            x: draggable1.page.withoutMargin.right - 1,
            y: draggable2.page.withoutMargin.center.y,
          },
        };

        const impact: DragImpact = getDragImpact({
          page,
          withinDroppable,
          draggableId: draggable2.id,
          draggables,
          droppables,
        });

        it('should return the droppable the item is in', () => {
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.droppableId).toBe(droppable.id);
        });

        it('should return the new index of the item', () => {
          // Moving from second position to first position
          if (!impact.destination) {
            throw new Error('invalid result');
          }
          expect(impact.destination.index).toBe(0);
        });

        it('should indicate that the item being moved backward', () => {
          expect(impact.movement.isBeyondStartPosition).toBe(false);
        });

        it('should indicate that the item being moved should move the width of the item being dragged', () => {
          const expected: Position = {
            x: draggable2.page.withMargin.width,
            y: 0,
          };
          expect(impact.movement.amount).toEqual(expected);
        });

        it('should return the items that need to be moved', () => {
          expect(impact.movement.draggables).toEqual([draggable1.id]);
        });
      });
    });
  });

  describe('moving between lists', () => {
    const homeDroppable = getDroppableWithDraggables({
      droppableId: 'drop-home',
      droppableRect: { top: 0, left: 0, bottom: 600, right: 100 },
      draggableRects: [
        { top: 0, left: 0, bottom: 100, right: 100 },
        { top: 101, left: 0, bottom: 300, right: 100 },
        { top: 301, left: 0, bottom: 600, right: 100 },
      ],
    });

    const destinationDroppable = getDroppableWithDraggables({
      droppableId: 'drop-destination',
      droppableRect: { top: 100, left: 110, bottom: 800, right: 210 },
      draggableRects: [
        { top: 100, left: 110, bottom: 400, right: 210 },
        { top: 401, left: 110, bottom: 600, right: 210 },
        { top: 601, left: 110, bottom: 700, right: 210 },
      ],
    });

    const droppables = {
      [homeDroppable.droppableId]: homeDroppable.droppable,
      [destinationDroppable.droppableId]: destinationDroppable.droppable,
    };

    const draggables = {
      ...homeDroppable.draggables,
      ...destinationDroppable.draggables,
    };

    const draggableId = homeDroppable.draggableIds[0];
    const draggedItem = homeDroppable.draggables[draggableId];

    describe('moving outside a droppable', () => {
      const page = {
        x: homeDroppable.droppable.page.withMargin.center.x,
        y: homeDroppable.droppable.page.withMargin.height + 1,
      };
      const withinDroppable = { center: page };
      const impact = getDragImpact({
        page,
        withinDroppable,
        draggableId,
        draggables,
        droppables,
      });

      it('should not return a destination', () => {
        expect(impact.destination).toBe(null);
      });
      it('should not return a movement amount', () => {
        expect(impact.movement.amount).toEqual(origin);
      });
      it('should not displace any items', () => {
        expect(impact.movement.draggables.length).toBe(0);
      });
    });

    describe('moving to the start of a foreign droppable', () => {
      const page = {
        x: destinationDroppable.droppable.page.withMargin.center.x,
        y: destinationDroppable.droppable.page.withMargin.top + 1,
      };
      const withinDroppable = { center: page };
      const impact = getDragImpact({
        page,
        withinDroppable,
        draggableId,
        draggables,
        droppables,
      });

      it('should return the destination droppable', () => {
        expect(impact.destination && impact.destination.droppableId)
          .toBe(destinationDroppable.droppableId);
      });
      it('should return an index of 0 (first position)', () => {
        expect(impact.destination && impact.destination.index).toEqual(0);
      });
      it('should indicate that items must be displaced forwards', () => {
        expect(impact.movement.isBeyondStartPosition).toBe(false);
      });
      it('should indicate that items need to be displaced by the height of the dragged item', () => {
        const expected = patch('y', draggedItem.page.withMargin.height);
        expect(impact.movement.amount).toEqual(expected);
      });
      it('should displace all items in the destination droppable', () => {
        expect(impact.movement.draggables).toEqual(destinationDroppable.draggableIds);
      });
    });

    describe('moving to the second position of a foreign droppable', () => {
      const page = {
        x: destinationDroppable.droppable.page.withMargin.center.x,
        y: destinationDroppable.draggables[
          destinationDroppable.draggableIds[1]
        ].page.withMargin.top + 1,
      };
      const withinDroppable = { center: page };
      const impact = getDragImpact({
        page,
        withinDroppable,
        draggableId,
        draggables,
        droppables,
      });

      it('should return the destination droppable', () => {
        expect(impact.destination && impact.destination.droppableId)
          .toBe(destinationDroppable.droppableId);
      });
      it('should return an index of 1 (second position)', () => {
        expect(impact.destination && impact.destination.index).toEqual(1);
      });
      it('should indicate that items must be displaced forwards', () => {
        expect(impact.movement.isBeyondStartPosition).toBe(false);
      });
      it('should indicate that items need to be displaced by the height of the dragged item', () => {
        const expected = patch('y', draggedItem.page.withMargin.height);
        expect(impact.movement.amount).toEqual(expected);
      });
      it('should displace all items in the destination droppable except the first', () => {
        expect(impact.movement.draggables).toEqual(
          destinationDroppable.draggableIds.slice(1 - destinationDroppable.draggableIds.length)
        );
      });
    });

    describe('moving to the end of a foreign droppable', () => {
      const page = {
        x: destinationDroppable.droppable.page.withMargin.center.x,
        y: destinationDroppable.droppable.page.withMargin.bottom - 1,
      };
      const withinDroppable = { center: page };
      const impact = getDragImpact({
        page,
        withinDroppable,
        draggableId,
        draggables,
        droppables,
      });

      it('should return the destination droppable', () => {
        expect(impact.destination && impact.destination.droppableId)
          .toBe(destinationDroppable.droppableId);
      });
      it('should return an index equal to the number of draggables in the destination droppable', () => {
        expect(impact.destination && impact.destination.index)
          .toEqual(destinationDroppable.draggableIds.length);
      });
      it('should indicate that items must be displaced forwards', () => {
        expect(impact.movement.isBeyondStartPosition).toBe(false);
      });
      it('should indicate that items need to be displaced by the height of the dragged item', () => {
        const expected = patch('y', draggedItem.page.withMargin.height);
        expect(impact.movement.amount).toEqual(expected);
      });
      it('should not displace any items', () => {
        expect(impact.movement.draggables.length).toBe(0);
      });
    });

    describe('when the foreign droppable is scrolled', () => {
      // top of the first item
      const page = {
        x: destinationDroppable.droppable.page.withMargin.center.x,
        y: destinationDroppable.droppable.page.withMargin.top + 1,
      };

      // scroll past the first item
      const center = add(page, {
        x: 0,
        y: destinationDroppable.draggables[
          destinationDroppable.draggableIds[0]
        ].page.withMargin.height,
      });
      const withinDroppable = { center };
      const impact = getDragImpact({
        page,
        withinDroppable,
        draggableId,
        draggables,
        droppables,
      });

      it('should return the destination droppable', () => {
        expect(impact.destination && impact.destination.droppableId)
          .toBe(destinationDroppable.droppableId);
      });
      it('should account for scrolling when calculating the index', () => {
        expect(impact.destination && impact.destination.index).toEqual(1);
      });
      it('should indicate that items must be displaced forwards', () => {
        expect(impact.movement.isBeyondStartPosition).toBe(false);
      });
      it('should indicate that items need to be displaced by the height of the dragged item', () => {
        const expected = patch('y', draggedItem.page.withMargin.height);
        expect(impact.movement.amount).toEqual(expected);
      });
      it('should account for scrolling when determining which items are being displaced', () => {
        expect(impact.movement.draggables).toEqual(
          destinationDroppable.draggableIds.slice(1 - destinationDroppable.draggableIds.length)
        );
      });
    });
  });
});
