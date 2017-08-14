// @flow
import getNewHomeClientOffset from '../../../src/state/get-new-home-client-offset';
import noImpact from '../../../src/state/no-impact';
import { getDraggableDimension } from '../../../src/state/dimension';
import { add, subtract } from '../../../src/state/position';
import getClientRect from '../../utils/get-client-rect';
import { vertical, horizontal } from '../../../src/state/axis';
import type {
  DroppableId,
  DragMovement,
  Position,
  DraggableDimension,
  DraggableDimensionMap,
} from '../../../src/types';

const origin: Position = { x: 0, y: 0 };
const droppableId: DroppableId = 'drop-1';

describe('get new home client offset', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('vertical', () => {
    const draggable1: DraggableDimension = getDraggableDimension({
      id: 'drag-1',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      }),
    });

    // huge height: 199
    const draggable2: DraggableDimension = getDraggableDimension({
      id: 'drag-2',
      droppableId,
      clientRect: getClientRect({
        top: 101,
        left: 0,
        bottom: 300,
        right: 100,
      }),
    });

    // height: 299
    const draggable3: DraggableDimension = getDraggableDimension({
      id: 'drag-3',
      droppableId,
      clientRect: getClientRect({
        top: 301,
        left: 0,
        bottom: 600,
        right: 100,
      }),
    });

    const draggables: DraggableDimensionMap = {
      [draggable1.id]: draggable1,
      [draggable2.id]: draggable2,
      [draggable3.id]: draggable3,
    };

    it('should return the total scroll diff if nothing has moved', () => {
      const offset: Position = {
        x: 100,
        y: 200,
      };
      const droppableScrollDiff: Position = {
        x: 20,
        y: 10,
      };
      const windowScrollDiff: Position = {
        x: 30,
        y: 20,
      };

      const result: Position = getNewHomeClientOffset({
        movement: noImpact.movement,
        clientOffset: offset,
        pageOffset: offset,
        droppableScrollDiff,
        windowScrollDiff,
        draggables,
        axis: vertical,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
    });

    it('should return the total scroll diff is no axis is provided', () => {
      const offset: Position = {
        x: 100,
        y: 200,
      };
      const droppableScrollDiff: Position = {
        x: 20,
        y: 10,
      };
      const windowScrollDiff: Position = {
        x: 30,
        y: 20,
      };
      // There should be no movement without an axis
      // This is an error situation
      const movement: DragMovement = {
        draggables: [draggable2.id, draggable3.id],
        amount: {
          x: 0,
          y: draggable1.page.withMargin.height,
        },
        isMovingForward: true,
      };

      const result: Position = getNewHomeClientOffset({
        movement,
        clientOffset: offset,
        pageOffset: offset,
        droppableScrollDiff,
        windowScrollDiff,
        draggables,
        axis: null,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
      // this is an error situation
      expect(console.error).toHaveBeenCalled();
    });

    describe('moving forward', () => {
      // Moving the first item down into the third position

      // Where the users cursor is
      const selection: Position = {
        x: draggable1.client.withoutMargin.center.x,
        y: draggable3.client.withoutMargin.top + 1,
      };

      // moving the first item down past the third item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(selection, draggable1.client.withoutMargin.center);

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: [draggable2.id, draggable3.id],
          amount: {
            x: 0,
            y: draggable1.page.withMargin.height,
          },
          isMovingForward: true,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const verticalChange = {
          x: 0,
          y: draggable2.page.withMargin.height + draggable3.page.withMargin.height,
        };
        // How far away it is from where it needs to end up
        const diff: Position = subtract(verticalChange, pageOffset);
        // this is the final client offset
        const expected = add(clientOffset, diff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff: origin,
          draggables,
          axis: vertical,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item down past the third using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          draggable1.page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: [draggable2.id, draggable3.id],
          amount: {
            x: 0,
            y: draggable1.page.withMargin.height,
          },
          isMovingForward: true,
        };
        // this is where it needs to end up
        const verticalChange = {
          x: 0,
          y: draggable2.page.withMargin.height + draggable3.page.withMargin.height,
        };
        // this is how far away it is from where it needs to end up
        const diff: Position = subtract(verticalChange, pageOffset);
        // this is the final client offset
        const expected = add(diff, droppableScrollDiff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff,
          windowScrollDiff: origin,
          draggables,
          axis: vertical,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item down past the third using only window scroll
      it('should account for any changes in the window scroll', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = {
          x: 10,
          y: 200,
        };
        const droppableScrollDiff = origin;
        const windowScrollDiff = pageOffset;
        const movement: DragMovement = {
          draggables: [draggable2.id, draggable3.id],
          amount: {
            x: 0,
            y: draggable1.page.withMargin.height,
          },
          isMovingForward: true,
        };
        // this is where it needs to end up
        const verticalChange = {
          x: 0,
          y: draggable2.page.withMargin.height + draggable3.page.withMargin.height,
        };
        // this is how far away it is from where it needs to end up
        const diff: Position = subtract(verticalChange, pageOffset);
        // this is the final client offset
        const expected = add(diff, droppableScrollDiff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff,
          draggables,
          axis: vertical,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });

    describe('moving backward', () => {
      // Moving the third item back into the first position

      // Where the users cursor is
      const selection: Position = {
        x: draggable3.client.withoutMargin.center.x,
        y: draggable1.client.withoutMargin.bottom - 1,
      };

      // moving the third item backwards past the first and second item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(selection, draggable3.client.withoutMargin.center);

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: [draggable1.id, draggable2.id],
          amount: {
            x: 0,
            y: draggable3.page.withMargin.height,
          },
          isMovingForward: false,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const verticalChange = {
          x: 0,
          y: -(draggable1.page.withMargin.height + draggable2.page.withMargin.height),
        };
        // How far away it is from where it needs to end up
        const diff: Position = subtract(verticalChange, pageOffset);
        // this is the final client offset
        const expected = add(clientOffset, diff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff: origin,
          draggables,
          axis: vertical,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the third item back past the first and second item using only window scroll
      it('should account for the current page location of the dragging item', () => {
        // have not moved the item on the screen at all
        const clientOffset: Position = origin;
        // the window has scrolled to get it to the selection point
        const pageOffset: Position = subtract(selection, draggable3.page.withoutMargin.center);
        const movement: DragMovement = {
          draggables: [draggable1.id, draggable2.id],
          amount: {
            x: 0,
            y: draggable3.page.withMargin.height,
          },
          isMovingForward: false,
        };
        // How much distance the item needs to travel to be in its new home
        // from where it started
        const verticalChange = {
          x: 0,
          y: -(draggable1.page.withMargin.height + draggable2.page.withMargin.height),
        };
        // How far away it is from where it needs to end up
        const diff: Position = subtract(verticalChange, pageOffset);
        // this is the final client offset
        const expected = add(clientOffset, diff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff: origin,
          draggables,
          axis: vertical,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the third item backwards past the first and second item using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          draggable3.page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: [draggable1.id, draggable2.id],
          amount: {
            x: 0,
            y: draggable3.page.withMargin.height,
          },
          isMovingForward: false,
        };
        // this is where it needs to end up
        const verticalChange = {
          x: 0,
          y: -(draggable1.page.withMargin.height + draggable2.page.withMargin.height),
        };
        // this is how far away it is from where it needs to end up
        const diff: Position = subtract(verticalChange, pageOffset);
        // this is the final client offset
        const expected = add(diff, droppableScrollDiff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff,
          windowScrollDiff: origin,
          draggables,
          axis: vertical,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });
  });

  describe('horizontal', () => {
    const draggable1: DraggableDimension = getDraggableDimension({
      id: 'drag-1',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      }),
    });

    // width: 199
    const draggable2: DraggableDimension = getDraggableDimension({
      id: 'drag-2',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 101,
        bottom: 100,
        right: 300,
      }),
    });

    // height: 299
    const draggable3: DraggableDimension = getDraggableDimension({
      id: 'drag-3',
      droppableId,
      clientRect: getClientRect({
        top: 0,
        left: 500,
        bottom: 100,
        right: 301,
      }),
    });

    const draggables: DraggableDimensionMap = {
      [draggable1.id]: draggable1,
      [draggable2.id]: draggable2,
      [draggable3.id]: draggable3,
    };

    it('should return to the total scroll diff if nothing has moved', () => {
      const offset: Position = {
        x: 100,
        y: 200,
      };
      const droppableScrollDiff: Position = {
        x: 20,
        y: 10,
      };
      const windowScrollDiff: Position = {
        x: 30,
        y: 20,
      };

      const result: Position = getNewHomeClientOffset({
        movement: noImpact.movement,
        clientOffset: offset,
        pageOffset: offset,
        droppableScrollDiff,
        windowScrollDiff,
        draggables,
        axis: horizontal,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
    });

    it('should return the total scroll diff is no axis is provided', () => {
      const offset: Position = {
        x: 100,
        y: 200,
      };
      const droppableScrollDiff: Position = {
        x: 20,
        y: 10,
      };
      const windowScrollDiff: Position = {
        x: 30,
        y: 20,
      };
      // There should be no movement without an axis
      // This is an error situation
      const movement: DragMovement = {
        draggables: [draggable2.id, draggable3.id],
        amount: {
          x: draggable1.page.withMargin.width,
          y: 0,
        },
        isMovingForward: true,
      };

      const result: Position = getNewHomeClientOffset({
        movement,
        clientOffset: offset,
        pageOffset: offset,
        droppableScrollDiff,
        windowScrollDiff,
        draggables,
        axis: null,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
      // this is an error situation
      expect(console.error).toHaveBeenCalled();
    });

    describe('moving forward', () => {
      // Moving the first item forward into the third position

      // Where the users cursor is
      const selection: Position = {
        x: draggable3.client.withoutMargin.left + 1,
        y: draggable1.client.withoutMargin.center.y,
      };

      // moving the first item down past the third item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(selection, draggable1.client.withoutMargin.center);

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: [draggable2.id, draggable3.id],
          amount: {
            x: draggable1.page.withMargin.width,
            y: 0,
          },
          isMovingForward: true,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const horizontalChange = {
          x: draggable2.page.withMargin.width + draggable3.page.withMargin.width,
          y: 0,
        };
        // How far away it is from where it needs to end up
        const diff: Position = subtract(horizontalChange, pageOffset);
        // this is the final client offset
        const expected = add(clientOffset, diff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff: origin,
          draggables,
          axis: horizontal,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item down past the third using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          draggable1.page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: [draggable2.id, draggable3.id],
          amount: {
            x: draggable1.page.withMargin.width,
            y: 0,
          },
          isMovingForward: true,
        };
        // this is where it needs to end up
        const horizontalChange = {
          x: draggable2.page.withMargin.width + draggable3.page.withMargin.width,
          y: 0,
        };
        // this is how far away it is from where it needs to end up
        const diff: Position = subtract(horizontalChange, pageOffset);
        // this is the final client offset
        const expected = add(diff, droppableScrollDiff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff,
          windowScrollDiff: origin,
          draggables,
          axis: horizontal,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item forward past the third using only window scroll
      it('should account for any changes in the window scroll', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = {
          x: 10,
          y: 200,
        };
        const droppableScrollDiff = origin;
        const windowScrollDiff = pageOffset;
        const movement: DragMovement = {
          draggables: [draggable2.id, draggable3.id],
          amount: {
            x: draggable1.page.withMargin.width,
            y: 0,
          },
          isMovingForward: true,
        };
        // this is where it needs to end up
        const horizontalChange = {
          x: draggable2.page.withMargin.width + draggable3.page.withMargin.width,
          y: 0,
        };
        // this is how far away it is from where it needs to end up
        const diff: Position = subtract(horizontalChange, pageOffset);
        // this is the final client offset
        const expected = add(diff, droppableScrollDiff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff,
          draggables,
          axis: horizontal,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });

    describe('moving backward', () => {
      // Moving the third item back into the first position

      // Where the users cursor is
      const selection: Position = {
        x: draggable1.client.withoutMargin.right - 1,
        y: draggable3.client.withoutMargin.center.y,
      };

      // moving the third item back past the first and second item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(selection, draggable3.client.withoutMargin.center);

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: [draggable1.id, draggable2.id],
          amount: {
            x: draggable3.page.withMargin.width,
            y: 0,
          },
          isMovingForward: false,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const horizontalChange = {
          x: -(draggable1.page.withMargin.width + draggable2.page.withMargin.width),
          y: 0,
        };
        // How far away it is from where it needs to end up
        const diff: Position = subtract(horizontalChange, pageOffset);
        // this is the final client offset
        const expected = add(clientOffset, diff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff: origin,
          draggables,
          axis: horizontal,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the third item back past the first and second item using only window scroll
      it('should account for the current page location of the dragging item', () => {
        // have not moved the item on the screen at all
        const clientOffset: Position = origin;
        // the window has scrolled to get it to the selection point
        const pageOffset: Position = subtract(selection, draggable3.page.withoutMargin.center);
        const movement: DragMovement = {
          draggables: [draggable1.id, draggable2.id],
          amount: {
            x: draggable3.page.withMargin.width,
            y: 0,
          },
          isMovingForward: false,
        };
        // How much distance the item needs to travel to be in its new home
        // from where it started
        const horizontalChange = {
          x: -(draggable1.page.withMargin.width + draggable2.page.withMargin.width),
          y: 0,
        };
        // How far away it is from where it needs to end up
        const diff: Position = subtract(horizontalChange, pageOffset);
        // this is the final client offset
        const expected = add(clientOffset, diff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff: origin,
          windowScrollDiff: origin,
          draggables,
          axis: horizontal,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item down past the third using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          draggable3.page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: [draggable1.id, draggable2.id],
          amount: {
            x: draggable3.page.withMargin.width,
            y: 0,
          },
          isMovingForward: false,
        };
        // this is where it needs to end up
        const horizontalChange = {
          x: -(draggable1.page.withMargin.width + draggable2.page.withMargin.width),
          y: 0,
        };
        // this is how far away it is from where it needs to end up
        const diff: Position = subtract(horizontalChange, pageOffset);
        // this is the final client offset
        const expected = add(diff, droppableScrollDiff);

        const newHomeOffset = getNewHomeClientOffset({
          movement,
          clientOffset,
          pageOffset,
          droppableScrollDiff,
          windowScrollDiff: origin,
          draggables,
          axis: horizontal,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });
  });
});
