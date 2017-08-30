// @flow
import getNewHomeClientOffset from '../../../src/state/get-new-home-client-offset';
import noImpact from '../../../src/state/no-impact';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import { add, negate, subtract } from '../../../src/state/position';
import getClientRect from '../../utils/get-client-rect';
import type {
  DroppableId,
  DragMovement,
  Position,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
} from '../../../src/types';

type Rect = {|
  top: number,
  left: number,
  bottom: number,
  right: number,
|};

type CreateDroppableArgs = {|
  direction?: 'vertical' | 'horizontal',
  droppableId: DroppableId,
  droppableRect: Rect,
  draggableRects: Rect[],
|};

type TestDroppable = {
  droppableId: string,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  draggableIds: string[],
  draggableDimensions: DraggableDimension[],
};

const origin: Position = { x: 0, y: 0 };

const createDroppable = ({
  direction = 'vertical',
  droppableId,
  droppableRect,
  draggableRects,
}: CreateDroppableArgs): TestDroppable => {
  const droppable = getDroppableDimension({
    id: droppableId,
    direction,
    clientRect: getClientRect(droppableRect),
  });

  const draggableDimensions = draggableRects.map(
    (draggableRect, index) => getDraggableDimension({
      id: `${droppableId}::drag-${index}`,
      droppableId,
      clientRect: getClientRect(draggableRect),
    })
  );

  const draggables = draggableDimensions.reduce(
    (currentDraggables, draggable) => ({
      ...currentDraggables,
      [draggable.id]: draggable,
    }),
    {}
  );

  const draggableIds = Object.keys(draggables);

  return {
    droppableId,
    droppable,
    draggables,
    draggableIds,
    draggableDimensions,
  };
};

const getDistanceOverDraggables = dimension => arr => ({
  [dimension === 'height' ? 'y' : 'x']: arr.reduce(
    (total, draggable) => total + draggable.page.withMargin[dimension] + 1,
    0
  ),
  [dimension === 'height' ? 'x' : 'y']: 0,
});
const getVerticalDistanceOverDraggables = getDistanceOverDraggables('height');
const getHorizontalDistanceOverDraggables = getDistanceOverDraggables('width');

describe('get new home client offset', () => {
  let droppable;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });

    droppable = createDroppable({
      droppableId: 'drop-1',
      droppableRect: { top: 0, left: 0, bottom: 600, right: 100 },
      draggableRects: [
        { top: 0, left: 0, bottom: 100, right: 100 },
        { top: 101, left: 0, bottom: 300, right: 100 },
        { top: 301, left: 0, bottom: 600, right: 100 },
      ],
    });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('vertical', () => {
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
        draggables: droppable.draggables,
        draggableId: droppable.draggableIds[0],
        destinationDroppable: droppable.droppable,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
    });

    it('should return the total scroll diff if no destination is provided', () => {
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
        draggables: droppable.draggableIds.slice(1),
        amount: {
          x: 0,
          y: droppable.draggableDimensions[0].page.withMargin.height,
        },
        isBeyondStartPosition: true,
      };

      const result: Position = getNewHomeClientOffset({
        movement,
        clientOffset: offset,
        pageOffset: offset,
        droppableScrollDiff,
        windowScrollDiff,
        draggables: droppable.draggables,
        draggableId: droppable.draggableIds[0],
        destinationDroppable: null,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
    });

    describe('moving forward', () => {
      // Moving the first item down into the third position

      // Where the user's cursor is
      let selection: Position;

      beforeEach(() => {
        selection = {
          x: droppable.draggableDimensions[0].client.withoutMargin.center.x,
          y: droppable.draggableDimensions[2].client.withoutMargin.top + 1,
        };
      });

      // moving the first item down past the third item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(
          selection,
          droppable.draggableDimensions[0].client.withoutMargin.center
        );

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(1),
          amount: {
            x: 0,
            y: droppable.draggableDimensions[0].page.withMargin.height,
          },
          isBeyondStartPosition: true,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const verticalChange = getVerticalDistanceOverDraggables(
          droppable.draggableDimensions.slice(1)
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[0],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item down past the third using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          droppable.draggableDimensions[0].page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(1),
          amount: {
            x: 0,
            y: droppable.draggableDimensions[0].page.withMargin.height,
          },
          isBeyondStartPosition: true,
        };
        // this is where it needs to end up
        const verticalChange = getVerticalDistanceOverDraggables(
          droppable.draggableDimensions.slice(1)
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[0],
          destinationDroppable: droppable.droppable,
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
          draggables: droppable.draggableIds.slice(1),
          amount: {
            x: 0,
            y: droppable.draggableDimensions[0].page.withMargin.height,
          },
          isBeyondStartPosition: true,
        };
        // this is where it needs to end up
        const verticalChange = getVerticalDistanceOverDraggables(
          droppable.draggableDimensions.slice(1)
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[0],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });

    describe('moving backward', () => {
      // Moving the third item back into the first position

      let selection: Position;

      beforeEach(() => {
        selection = {
          x: droppable.draggableDimensions[2].client.withoutMargin.center.x,
          y: droppable.draggableDimensions[0].client.withoutMargin.bottom - 1,
        };
      });

      // moving the third item backwards past the first and second item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(
          selection,
          droppable.draggableDimensions[2].client.withoutMargin.center
        );

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(0, 2),
          amount: {
            x: 0,
            y: droppable.draggableDimensions[2].page.withMargin.height,
          },
          isBeyondStartPosition: false,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const verticalChange = negate(
          getVerticalDistanceOverDraggables(droppable.draggableDimensions.slice(0, 2))
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[2],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the third item back past the first and second item using only window scroll
      it('should account for the current page location of the dragging item', () => {
        // have not moved the item on the screen at all
        const clientOffset: Position = origin;
        // the window has scrolled to get it to the selection point
        const pageOffset: Position = subtract(
          selection,
          droppable.draggableDimensions[2].page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(0, 2),
          amount: {
            x: 0,
            y: droppable.draggableDimensions[2].page.withMargin.height,
          },
          isBeyondStartPosition: false,
        };
        // How much distance the item needs to travel to be in its new home
        // from where it started
        const verticalChange = negate(
          getVerticalDistanceOverDraggables(droppable.draggableDimensions.slice(0, 2))
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[2],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the third item backwards past the first and second item using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          droppable.draggableDimensions[2].page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(0, 2),
          amount: {
            x: 0,
            y: droppable.draggableDimensions[2].page.withMargin.height,
          },
          isBeyondStartPosition: false,
        };
        // this is where it needs to end up
        const verticalChange = negate(
          getVerticalDistanceOverDraggables(droppable.draggableDimensions.slice(0, 2))
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[2],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });
  });

  describe('horizontal', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => { });

      droppable = createDroppable({
        direction: 'horizontal',
        droppableId: 'drop-1',
        droppableRect: { top: 0, left: 0, bottom: 100, right: 500 },
        draggableRects: [
          { top: 0, left: 0, bottom: 100, right: 100 },
          { top: 0, left: 101, bottom: 100, right: 300 },
          { top: 0, left: 301, bottom: 100, right: 500 },
        ],
      });

      // draggable1 = getDraggableDimension({
      //   id: 'drag-1',
      //   droppableId,
      //   clientRect: getClientRect({
      //     top: 0,
      //     left: 0,
      //     bottom: 100,
      //     right: 100,
      //   }),
      // });

      // // huge height: 199
      // draggable2 = getDraggableDimension({
      //   id: 'drag-2',
      //   droppableId,
      //   clientRect: getClientRect({
      //     top: 0,
      //     left: 101,
      //     bottom: 100,
      //     right: 300,
      //   }),
      // });

      // // height: 299
      // draggable3 = getDraggableDimension({
      //   id: 'drag-3',
      //   droppableId,
      //   clientRect: getClientRect({
      //     top: 0,
      //     left: 301,
      //     bottom: 100,
      //     right: 500,
      //   }),
      // });

      // draggables = {
      //   [draggable1.id]: draggable1,
      //   [draggable2.id]: draggable2,
      //   [draggable3.id]: draggable3,
      // };

      // draggableId = Object.keys(draggables)[0];

      // destinationDroppable = getDroppableDimension({
      //   id: droppableId,
      //   direction: 'horizontal',
      //   clientRect: getClientRect({
      //     top: 0,
      //     left: 0,
      //     bottom: 100,
      //     right: 500,
      //   }),
      // });
    });

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
        draggables: droppable.draggables,
        draggableId: droppable.draggableIds[0],
        destinationDroppable: droppable.droppable,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
    });

    it('should return the total scroll diff is no destination is provided', () => {
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
        draggables: droppable.draggableIds.slice(1),
        amount: {
          x: droppable.draggableDimensions[0].page.withMargin.width,
          y: 0,
        },
        isBeyondStartPosition: true,
      };

      const result: Position = getNewHomeClientOffset({
        movement,
        clientOffset: offset,
        pageOffset: offset,
        droppableScrollDiff,
        windowScrollDiff,
        draggables: droppable.draggables,
        draggableId: droppable.draggableIds[0],
        destinationDroppable: null,
      });

      expect(result).toEqual(add(droppableScrollDiff, windowScrollDiff));
    });

    describe('moving forward', () => {
      // Moving the first item forward into the third position

      // Where the user's cursor is
      let selection: Position;

      beforeEach(() => {
        selection = {
          x: droppable.draggableDimensions[2].client.withoutMargin.left + 1,
          y: droppable.draggableDimensions[0].client.withoutMargin.center.y,
        };
      });

      // moving the first item down past the third item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(
          selection,
          droppable.draggableDimensions[0].client.withoutMargin.center
        );

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(1),
          amount: {
            x: droppable.draggableDimensions[0].page.withMargin.width,
            y: 0,
          },
          isBeyondStartPosition: true,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const horizontalChange = getHorizontalDistanceOverDraggables(
          droppable.draggableDimensions.slice(1)
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[0],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item down past the third using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          droppable.draggableDimensions[0].page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(1),
          amount: {
            x: droppable.draggableDimensions[0].page.withMargin.width,
            y: 0,
          },
          isBeyondStartPosition: true,
        };
        // this is where it needs to end up
        const horizontalChange = getHorizontalDistanceOverDraggables(
          droppable.draggableDimensions.slice(1)
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[0],
          destinationDroppable: droppable.droppable,
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
          draggables: droppable.draggableIds.slice(1),
          amount: {
            x: droppable.draggableDimensions[0].page.withMargin.width,
            y: 0,
          },
          isBeyondStartPosition: true,
        };
        // this is where it needs to end up
        const horizontalChange = getHorizontalDistanceOverDraggables(
          droppable.draggableDimensions.slice(1)
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[0],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });

    describe('moving backward', () => {
      // Moving the third item back into the first position

      // Where the user's cursor is
      let selection: Position;

      beforeEach(() => {
        selection = {
          x: droppable.draggableDimensions[0].client.withoutMargin.right - 1,
          y: droppable.draggableDimensions[2].client.withoutMargin.center.y,
        };
      });

      // moving the third item back past the first and second item
      it('should account for the current client location of the dragging item', () => {
        // The offset needed to get to the selection.
        const clientOffset: Position = subtract(
          selection,
          droppable.draggableDimensions[2].client.withoutMargin.center
        );

        // this test does not exercise page movement
        const pageOffset: Position = clientOffset;

        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(0, 2),
          amount: {
            x: droppable.draggableDimensions[2].page.withMargin.width,
            y: 0,
          },
          isBeyondStartPosition: false,
        };

        // How much distance the item needs to travel to be in its new home
        // from where it started
        const horizontalChange = negate(
          getHorizontalDistanceOverDraggables(droppable.draggableDimensions.slice(0, 2))
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[2],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the third item back past the first and second item using only window scroll
      it('should account for the current page location of the dragging item', () => {
        // have not moved the item on the screen at all
        const clientOffset: Position = origin;
        // the window has scrolled to get it to the selection point
        const pageOffset: Position = subtract(
          selection,
          droppable.draggableDimensions[2].page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(0, 2),
          amount: {
            x: droppable.draggableDimensions[2].page.withMargin.width,
            y: 0,
          },
          isBeyondStartPosition: false,
        };
        // How much distance the item needs to travel to be in its new home
        // from where it started
        const horizontalChange = negate(
          getHorizontalDistanceOverDraggables(droppable.draggableDimensions.slice(0, 2))
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[2],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });

      // moving the first item down past the third using only container scroll
      it('should account for any changes in the droppables scroll container', () => {
        const clientOffset: Position = origin;
        const pageOffset: Position = origin;
        const droppableScrollDiff: Position = subtract(
          selection,
          droppable.draggableDimensions[2].page.withoutMargin.center
        );
        const movement: DragMovement = {
          draggables: droppable.draggableIds.slice(0, 2),
          amount: {
            x: droppable.draggableDimensions[2].page.withMargin.width,
            y: 0,
          },
          isBeyondStartPosition: false,
        };
        // this is where it needs to end up
        const horizontalChange = negate(
          getHorizontalDistanceOverDraggables(droppable.draggableDimensions.slice(0, 2))
        );
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
          draggables: droppable.draggables,
          draggableId: droppable.draggableIds[2],
          destinationDroppable: droppable.droppable,
        });

        expect(newHomeOffset).toEqual(expected);
      });
    });
  });
});
