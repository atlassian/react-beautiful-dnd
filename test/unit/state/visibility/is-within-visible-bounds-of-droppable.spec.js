// @flow
import { getDroppableDimension, scrollDroppable } from '../../../../src/state/dimension';
import { isPositionVisible } from '../../../../src/state/visibility/is-within-visible-bounds-of-droppable';
import type {
  Area, DroppableDimension, Position,
} from '../../../../src/types';
import getArea from '../../../../src/state/get-area';

const frameClient: Area = getArea({
  top: 10,
  left: 10,
  right: 90,
  bottom: 90,
});

const client: Area = getArea({
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
});

const frameScroll: Position = { x: 0, y: 0 };

const droppable: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'drop-1',
    type: 'TYPE',
  },
  client,
  frameClient,
  frameScroll,
});

describe('is within visible bounds of droppable', () => {
  describe('is position visible', () => {
    describe('without scroll update', () => {
      it('should return true if the position is within the clipped area', () => {
        expect(isPositionVisible(droppable)(frameClient.center)).toBe(true);
      });

      it('should return false if the position is not within the subject', () => {
        expect(isPositionVisible(droppable)({ x: 1000, y: 1000 })).toBe(false);
      });

      it('should return false if the position is not within the clipped area', () => {
        // this point is not in the clipped area, but is within the client
        const point: Position = { x: 1, y: 1 };

        expect(isPositionVisible(droppable)(point)).toBe(false);
      });
    });

    describe('with scroll update', () => {
      // scrolling has no impact on the frame
    });
  });

  describe('is spacing visible', () => {
    // TODO: partial and total visibility
  });
});
