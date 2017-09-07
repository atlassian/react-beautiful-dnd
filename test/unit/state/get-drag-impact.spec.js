// @flow
import {
  getDraggableDimension,
  getDroppableDimension,
} from '../../../src/state/dimension';
// eslint-disable-next-line no-duplicate-imports
import getDragImpact from '../../../src/state/get-drag-impact';
import noImpact from '../../../src/state/no-impact';
import getClientRect from '../../utils/get-client-rect';
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
  // TODO: add tests for when not in home list

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
});
