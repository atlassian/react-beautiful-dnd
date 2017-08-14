// @flow
import {
  getDraggableDimension,
  getDroppableDimension,
} from '../../../src/state/dimension';
import { vertical, horizontal } from '../../../src/state/axis';
// eslint-disable-next-line no-duplicate-imports
import type { Margin, ClientRect } from '../../../src/state/dimension';
import type {
  DraggableId,
  DroppableId,
  Position,
  DraggableDimension,
  DroppableDimension,
  DimensionFragment,
} from '../../../src/types';

const draggableId: DraggableId = 'drag-1';
const droppableId: DroppableId = 'drop-1';

const clientRect: ClientRect = {
  top: 10,
  right: 110,
  bottom: 90,
  left: 20,
  width: 90,
  height: 80,
};
const margin: Margin = {
  top: 1, right: 2, bottom: 3, left: 4,
};
const windowScroll: Position = {
  x: 50,
  y: 80,
};

describe('dimension', () => {
  describe('draggable dimension', () => {
    const dimension: DraggableDimension = getDraggableDimension({
      id: draggableId,
      droppableId,
      clientRect,
      margin,
      windowScroll,
    });

    describe('client coordinates', () => {
      it('should return a portion that does not account for margins', () => {
        const fragment: DimensionFragment = {
          top: clientRect.top,
          right: clientRect.right,
          bottom: clientRect.bottom,
          left: clientRect.left,
          width: clientRect.width,
          height: clientRect.height,
          center: {
            x: (clientRect.left + clientRect.right) / 2,
            y: (clientRect.top + clientRect.bottom) / 2,
          },
        };
        expect(dimension.client.withoutMargin).toEqual(fragment);
      });

      it('should return a portion that considers margins', () => {
        const fragment: DimensionFragment = {
          top: clientRect.top + margin.top,
          right: clientRect.right + margin.right,
          bottom: clientRect.bottom + margin.bottom,
          left: clientRect.left + margin.left,
          width: clientRect.width + margin.left + margin.right,
          height: clientRect.height + margin.top + margin.bottom,
          center: {
            x: (clientRect.left + margin.left + clientRect.right + margin.right) / 2,
            y: (clientRect.top + margin.top + clientRect.bottom + margin.bottom) / 2,
          },
        };
        expect(dimension.client.withMargin).toEqual(fragment);
      });
    });

    describe('page coordination', () => {
      it('should return a portion that does not account for margins', () => {
        const top: number = clientRect.top + windowScroll.y;
        const right: number = clientRect.right + windowScroll.x;
        const bottom: number = clientRect.bottom + windowScroll.y;
        const left: number = clientRect.left + windowScroll.x;

        const fragment: DimensionFragment = {
          top,
          right,
          bottom,
          left,
          width: clientRect.width,
          height: clientRect.height,
          center: {
            x: (left + right) / 2,
            y: (top + bottom) / 2,
          },
        };
        expect(dimension.page.withoutMargin).toEqual(fragment);
      });

      it('should return a portion that considers margins', () => {
        const top: number = clientRect.top + margin.top + windowScroll.y;
        const right: number = clientRect.right + margin.right + windowScroll.x;
        const bottom: number = clientRect.bottom + margin.bottom + windowScroll.y;
        const left: number = clientRect.left + margin.left + windowScroll.x;

        const fragment: DimensionFragment = {
          top,
          right,
          bottom,
          left,
          width: clientRect.width + margin.left + margin.right,
          height: clientRect.height + margin.top + margin.bottom,
          center: {
            x: (left + right) / 2,
            y: (top + bottom) / 2,
          },
        };

        expect(dimension.page.withMargin).toEqual(fragment);
      });
    });
  });

  describe('droppable dimension', () => {
    const scroll: Position = {
      x: 10,
      y: 20,
    };

    const dimension: DroppableDimension = getDroppableDimension({
      id: droppableId,
      clientRect,
      margin,
      windowScroll,
      scroll,
    });

    it('should return the initial scroll as the initial and current scroll', () => {
      expect(dimension.scroll).toEqual({
        initial: scroll,
        current: scroll,
      });
    });

    it('should apply the correct axis', () => {
      const withDefault: DroppableDimension = getDroppableDimension({
        id: droppableId,
        clientRect,
        margin,
        windowScroll,
        scroll,
      });
      const withVertical: DroppableDimension = getDroppableDimension({
        id: droppableId,
        clientRect,
        margin,
        windowScroll,
        scroll,
        direction: 'vertical',
      });
      const withHorizontal: DroppableDimension = getDroppableDimension({
        id: droppableId,
        clientRect,
        margin,
        windowScroll,
        scroll,
        direction: 'horizontal',
      });

      // default uses vertical
      expect(withDefault.axis).toBe(vertical);
      // explicit vertical
      expect(withVertical.axis).toBe(vertical);
      // explicit horizontal
      expect(withHorizontal.axis).toBe(horizontal);
    });

    it('should return a portion that does not consider margins', () => {
      const top: number = clientRect.top + windowScroll.y;
      const left: number = clientRect.left + windowScroll.x;
      const bottom: number = clientRect.bottom + windowScroll.y;
      const right: number = clientRect.right + windowScroll.x;

      const fragment: DimensionFragment = {
        top,
        right,
        bottom,
        left,
        width: clientRect.width,
        height: clientRect.height,
        center: {
          x: (left + right) / 2,
          y: (top + bottom) / 2,
        },
      };

      expect(dimension.page.withoutMargin).toEqual(fragment);
    });

    it('should return a portion that does consider margins', () => {
      const top: number = clientRect.top + windowScroll.y + margin.top;
      const left: number = clientRect.left + windowScroll.x + margin.left;
      const bottom: number = clientRect.bottom + windowScroll.y + margin.bottom;
      const right: number = clientRect.right + windowScroll.x + margin.right;

      const fragment: DimensionFragment = {
        top,
        right,
        bottom,
        left,
        width: clientRect.width + margin.left + margin.right,
        height: clientRect.height + margin.top + margin.bottom,
        center: {
          x: (left + right) / 2,
          y: (top + bottom) / 2,
        },
      };

      expect(dimension.page.withMargin).toEqual(fragment);
    });
  });
});
