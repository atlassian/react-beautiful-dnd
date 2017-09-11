// @flow
import { isPointWithin, isDraggableWithin } from '../../../src/state/is-within-visible-bounds-of-droppable';
import { getDroppableDimension } from '../../../src/state/dimension';
import { add, subtract } from '../../../src/state/position';
import getClientRect from '../../utils/get-client-rect';
import getDroppableWithDraggables from '../../utils/get-droppable-with-draggables';
import type {
  Position,
} from '../../../src/types';

describe('is within visible bounds of a droppable', () => {
  const droppable = getDroppableDimension({
    id: 'droppable',
    clientRect: getClientRect({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    }),
  });

  describe('is point within', () => {
    const isWithinDroppable = isPointWithin(droppable);
    const { top, left, right, bottom } = droppable.page.withMargin;

    it('should return true if a point is within a droppable', () => {
      expect(isWithinDroppable(droppable.page.withMargin.center)).toBe(true);
    });

    it('should return true if a point is on any of the droppable boundaries', () => {
      const corners = [
        { x: left, y: top },
        { x: left, y: bottom },
        { x: right, y: top },
        { x: right, y: bottom },
      ];

      corners.forEach((corner: Position) => {
        expect(isWithinDroppable(corner)).toBe(true);
      });
    });

    it('should return false if the point is not within the droppable on any side', () => {
      const outside = [
        subtract({ x: left, y: top }, { x: 0, y: 10 }),    // too far top
        subtract({ x: left, y: bottom }, { x: 10, y: 0 }), // too far left
        add({ x: right, y: top }, { x: 10, y: 0 }),        // too far right
        add({ x: right, y: bottom }, { x: 0, y: 10 }),     // too far bottom
      ];

      outside.forEach((point: Position) => {
        expect(isWithinDroppable(point)).toBe(false);
      });
    });

    it('should be based on the page coordinates of the droppable', () => {
      const windowScroll: Position = {
        x: 200, y: 200,
      };
      const custom = getDroppableDimension({
        id: 'with-scroll',
        windowScroll,
        clientRect: getClientRect({
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
        }),
      });
      const isWithinCustom = isPointWithin(custom);

      // custom points
      expect(isWithinCustom({ x: 10, y: 10 })).toBe(false);
      expect(isWithinCustom({ x: 210, y: 210 })).toBe(true);

      // checking with the center position of the dimension itself
      expect(isWithinCustom(custom.client.withMargin.center)).toBe(false);
      expect(isWithinCustom(custom.page.withMargin.center)).toBe(true);
    });
  });

  describe('is draggable within', () => {
    it('should return true if the draggable is within the droppable', () => {
      const result = getDroppableWithDraggables({
        direction: 'vertical',
        droppableRect: { top: 0, left: 0, bottom: 100, right: 100 },
        draggableRects: [
          { top: 0, left: 0, bottom: 20, right: 100 },
        ],
      });
      const isWithinDroppable = isDraggableWithin(result.droppable);

      expect(isWithinDroppable(result.draggables[0])).toBe(true);
    });

    it('should return false if there is overlap on any side', () => {

    });

    it('should allow a small affordance to compensate for margin capturing inaccuracy', () => {

    });
  });
});
