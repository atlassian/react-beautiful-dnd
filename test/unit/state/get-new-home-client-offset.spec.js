// @flow
import getNewHomeClientOffset from '../../../src/state/get-new-home-client-offset';
import noImpact from '../../../src/state/no-impact';
import { add, negate, subtract } from '../../../src/state/position';
import getDroppableWithDraggables from '../../utils/get-droppable-with-draggables';
import type {
  DragMovement,
  Position,
} from '../../../src/types';

const origin: Position = { x: 0, y: 0 };

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
  describe('vertical', () => {
    const droppable = getDroppableWithDraggables({
      droppableId: 'drop-1',
      droppableRect: { top: 0, left: 0, bottom: 600, right: 100 },
      draggableRects: [
        { top: 0, left: 0, bottom: 100, right: 100 },
        { top: 101, left: 0, bottom: 300, right: 100 },
        { top: 301, left: 0, bottom: 600, right: 100 },
      ],
    });

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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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
    const droppable = getDroppableWithDraggables({
      direction: 'horizontal',
      droppableId: 'drop-1',
      droppableRect: { top: 0, left: 0, bottom: 100, right: 500 },
      draggableRects: [
        { top: 0, left: 0, bottom: 100, right: 100 },
        { top: 0, left: 101, bottom: 100, right: 300 },
        { top: 0, left: 301, bottom: 100, right: 500 },
      ],
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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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
          amount: origin,
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

  describe('multiple lists - vertical', () => {
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
      droppableRect: { top: 100, left: 110, bottom: 700, right: 210 },
      draggableRects: [
        { top: 100, left: 110, bottom: 400, right: 210 },
        { top: 401, left: 110, bottom: 600, right: 210 },
        { top: 601, left: 110, bottom: 700, right: 210 },
      ],
    });

    const emptyDroppable = getDroppableWithDraggables({
      droppableId: 'drop-empty',
      droppableRect: { top: 200, left: 220, bottom: 800, right: 320 },
      draggableRects: [],
    });

    const draggable = homeDroppable.draggableDimensions[0];

    const allDraggables = { ...homeDroppable.draggables, ...destinationDroppable.draggables };

    const selection = {
      x: emptyDroppable.droppable.client.withMargin.left + 1,
      y: emptyDroppable.droppable.client.withMargin.bottom + 1,
    };

    const clientOffset = subtract(selection, draggable.client.withMargin.center);

    const pageOffset = clientOffset;

    it('should move to the top of the droppable when landing in an empty droppable', () => {
      const movement: DragMovement = {
        draggables: emptyDroppable.draggableIds,
        amount: origin,
        isBeyondStartPosition: false,
      };

      // Align top-left of incoming draggable with top-left of droppable
      const expected = {
        x: (
          emptyDroppable.droppable.client.withMargin.left -
          draggable.client.withMargin.left
        ),
        y: (
          emptyDroppable.droppable.client.withMargin.top -
          draggable.client.withMargin.top
        ),
      };

      const newHomeOffset = getNewHomeClientOffset({
        movement,
        clientOffset,
        pageOffset,
        droppableScrollDiff: origin,
        windowScrollDiff: origin,
        draggables: allDraggables,
        draggableId: draggable.id,
        destinationDroppable: emptyDroppable.droppable,
      });

      expect(newHomeOffset).toEqual(expected);
    });

    it('should move into the top of the first-most displaced draggable when landing in a new droppable which already contains draggables', () => {
      const movement: DragMovement = {
        draggables: destinationDroppable.draggableIds.slice(2),
        amount: origin,
        isBeyondStartPosition: false,
      };

      const displacedDraggable = destinationDroppable.draggableDimensions[2];

      // Align top-left of incoming draggable with top-left of displaced draggable
      const expected = {
        x: (
          displacedDraggable.client.withMargin.left -
          draggable.client.withMargin.left
        ),
        y: (
          displacedDraggable.client.withMargin.top -
          draggable.client.withMargin.top
        ),
      };

      const newHomeOffset = getNewHomeClientOffset({
        movement,
        clientOffset,
        pageOffset,
        droppableScrollDiff: origin,
        windowScrollDiff: origin,
        draggables: allDraggables,
        draggableId: draggable.id,
        destinationDroppable: destinationDroppable.droppable,
      });

      expect(newHomeOffset).toEqual(expected);
    });

    it('should move in after the last draggable when landing on the end of a new droppable which already contains draggables', () => {
      const movement: DragMovement = {
        draggables: [],
        amount: origin,
        isBeyondStartPosition: false,
      };

      const lastDraggable = destinationDroppable.draggableDimensions[2];

      // Align top-left of incoming draggable with bottom-left of last draggable
      const expected = {
        x: (
          lastDraggable.client.withMargin.left -
          draggable.client.withMargin.left
        ),
        y: (
          lastDraggable.client.withMargin.bottom -
          draggable.client.withMargin.top
        ),
      };

      const newHomeOffset = getNewHomeClientOffset({
        movement,
        clientOffset,
        pageOffset,
        droppableScrollDiff: origin,
        windowScrollDiff: origin,
        draggables: allDraggables,
        draggableId: draggable.id,
        destinationDroppable: destinationDroppable.droppable,
      });

      expect(newHomeOffset).toEqual(expected);
    });

    it('should account for internal scrolling in the destination droppable', () => {
      const movement: DragMovement = {
        draggables: destinationDroppable.draggableIds.slice(2),
        amount: origin,
        isBeyondStartPosition: false,
      };

      const displacedDraggable = destinationDroppable.draggableDimensions[2];

      const horizontalScrollAmount = 50;
      const verticalScrollAmount = 100;

      const droppableScrollDiff = {
        x: -horizontalScrollAmount,
        y: -verticalScrollAmount,
      };

      // Offset alignment by scroll amount
      const expected = {
        x: (
          displacedDraggable.client.withMargin.left -
          draggable.client.withMargin.left -
          horizontalScrollAmount
        ),
        y: (
          displacedDraggable.client.withMargin.top -
          draggable.client.withMargin.top -
          verticalScrollAmount
        ),
      };

      const newHomeOffset = getNewHomeClientOffset({
        movement,
        clientOffset,
        pageOffset,
        droppableScrollDiff,
        windowScrollDiff: origin,
        draggables: allDraggables,
        draggableId: draggable.id,
        destinationDroppable: destinationDroppable.droppable,
      });

      expect(newHomeOffset).toEqual(expected);
    });

    it('should account for full page scrolling during the drag', () => {
      const movement: DragMovement = {
        draggables: destinationDroppable.draggableIds.slice(2),
        amount: origin,
        isBeyondStartPosition: false,
      };

      const displacedDraggable = destinationDroppable.draggableDimensions[2];

      const windowScrollDiff = {
        x: -100,
        y: -200,
      };

      // Since the whole page scrolled there should be no net difference in alignment
      const expected = {
        x: (
          displacedDraggable.client.withMargin.left -
          draggable.client.withMargin.left
        ),
        y: (
          displacedDraggable.client.withMargin.top -
          draggable.client.withMargin.top
        ),
      };

      const newHomeOffset = getNewHomeClientOffset({
        movement,
        clientOffset,
        pageOffset,
        droppableScrollDiff: origin,
        windowScrollDiff,
        draggables: allDraggables,
        draggableId: draggable.id,
        destinationDroppable: destinationDroppable.droppable,
      });

      expect(newHomeOffset).toEqual(expected);
    });
  });
});
