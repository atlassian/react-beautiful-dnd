// @flow
import {
  getDraggableDimension,
  getDroppableDimension,
} from '../../../src/state/dimension';
import { vertical, horizontal } from '../../../src/state/axis';
import getClientRect from '../../../src/state/get-client-rect';
import type {
  ClientRect,
  Spacing,
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
const margin: Spacing = {
  top: 1, right: 2, bottom: 3, left: 4,
};
const padding: Spacing = {
  top: 5, right: 6, bottom: 7, left: 8,
};
const windowScroll: Position = {
  x: 50,
  y: 80,
};

const getCenter = (rect: ClientRect | Spacing): Position => ({
  x: (rect.left + rect.right) / 2,
  y: (rect.top + rect.bottom) / 2,
});

describe('dimension', () => {
  describe('draggable dimension', () => {
    const dimension: DraggableDimension = getDraggableDimension({
      id: draggableId,
      droppableId,
      clientRect,
      margin,
      windowScroll,
    });

    describe('without scroll (client)', () => {
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
        const rect: ClientRect = getClientRect({
          top: clientRect.top - margin.top,
          right: clientRect.right + margin.right,
          bottom: clientRect.bottom + margin.bottom,
          left: clientRect.left - margin.left,
        });

        const fragment: DimensionFragment = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          center: getCenter(rect),
        };
        expect(dimension.client.withMargin).toEqual(fragment);
      });
    });

    describe('with scroll (page)', () => {
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
        const rect: ClientRect = getClientRect({
          top: (clientRect.top - margin.top) + windowScroll.y,
          right: clientRect.right + margin.right + windowScroll.x,
          bottom: clientRect.bottom + margin.bottom + windowScroll.y,
          left: (clientRect.left - margin.left) + windowScroll.x,
        });

        const fragment: DimensionFragment = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          center: getCenter(rect),
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
      padding,
      windowScroll,
      scroll,
    });

    it('should return the initial scroll as the initial and current scroll', () => {
      expect(dimension.container.scroll).toEqual({
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

    describe('without scroll (client)', () => {
      it('should return a portion that does not consider margins', () => {
        const fragment: DimensionFragment = {
          top: clientRect.top,
          right: clientRect.right,
          bottom: clientRect.bottom,
          left: clientRect.left,
          width: clientRect.width,
          height: clientRect.height,
          center: getCenter(clientRect),
        };

        expect(dimension.client.withoutMargin).toEqual(fragment);
      });

      it('should return a portion that does consider margins', () => {
        const rect: ClientRect = getClientRect({
          top: clientRect.top - margin.top,
          left: clientRect.left - margin.left,
          bottom: clientRect.bottom + margin.bottom,
          right: clientRect.right + margin.right,
        });

        const fragment: DimensionFragment = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          center: getCenter(rect),
        };

        expect(dimension.client.withMargin).toEqual(fragment);
      });

      it('should return a portion that considers margins and padding', () => {
        const rect: ClientRect = getClientRect({
          top: clientRect.top - margin.top - padding.top,
          left: clientRect.left - margin.left - padding.left,
          bottom: clientRect.bottom + margin.bottom + padding.bottom,
          right: clientRect.right + margin.right + padding.right,
        });

        const fragment: DimensionFragment = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          center: getCenter(rect),
        };

        expect(dimension.client.withMarginAndPadding).toEqual(fragment);
      });
    });

    describe('with scroll (page)', () => {
      it('should return a portion that does not consider margins', () => {
        const rect: ClientRect = getClientRect({
          top: clientRect.top + windowScroll.y,
          left: clientRect.left + windowScroll.x,
          bottom: clientRect.bottom + windowScroll.y,
          right: clientRect.right + windowScroll.x,
        });

        const fragment: DimensionFragment = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          center: getCenter(rect),
        };

        expect(dimension.page.withoutMargin).toEqual(fragment);
      });

      it('should return a portion that does consider margins', () => {
        const rect: ClientRect = getClientRect({
          top: (clientRect.top + windowScroll.y) - margin.top,
          left: (clientRect.left + windowScroll.x) - margin.left,
          bottom: clientRect.bottom + windowScroll.y + margin.bottom,
          right: clientRect.right + windowScroll.x + margin.right,
        });

        const fragment: DimensionFragment = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          center: getCenter(rect),
        };

        expect(dimension.page.withMargin).toEqual(fragment);
      });

      it('should return a portion that considers margins and padding', () => {
        const rect: ClientRect = getClientRect({
          top: (clientRect.top + windowScroll.y) - margin.top - padding.top,
          left: (clientRect.left + windowScroll.x) - margin.left - padding.left,
          bottom: clientRect.bottom + windowScroll.y + margin.bottom + padding.bottom,
          right: clientRect.right + windowScroll.x + margin.right + padding.right,
        });

        const fragment: DimensionFragment = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          center: getCenter(rect),
        };

        expect(dimension.page.withMarginAndPadding).toEqual(fragment);
      });
    });

    describe('calculating container dimension', () => {
      const id = 'droppable';
      const droppableRect = getClientRect({
        top: 0,
        right: 90,
        bottom: 90,
        left: 10,
      });
      const droppableMargin = { top: 10, right: 10, bottom: 10, left: 10 };
      const noMargin = { top: 0, right: 0, bottom: 0, left: 0 };

      it('should default to the droppable\'s dimension if none is provided', () => {
        const droppableDimension = getDroppableDimension({
          id,
          clientRect: droppableRect,
          margin: noMargin,
        });

        expect(droppableDimension.container.bounds)
          .toEqual(droppableDimension.page.withoutMargin);
      });

      it('should not include margins if the container is different from the droppable\'s spacing', () => {
        const container = getClientRect({
          top: 0,
          right: 10,
          bottom: 10,
          left: 0,
        });
        const droppableDimension = getDroppableDimension({
          id,
          clientRect: droppableRect,
          containerRect: container,
          margin: noMargin,
        });
        const expected = {
          ...container,
          center: getCenter(container),
        };

        expect(droppableDimension.container.bounds)
          .toEqual(expected);
      });

      it('should include margins if the container is the same as the droppable\'s spacing', () => {
        const container = droppableRect;
        const droppableDimension = getDroppableDimension({
          id,
          clientRect: droppableRect,
          containerRect: container,
          margin: droppableMargin,
        });
        const droppableDimensionNoContainerProvided = getDroppableDimension({
          id,
          clientRect: droppableRect,
          margin: droppableMargin,
        });
        const expectedSpacing = {
          top: container.top - droppableMargin.top,
          right: container.right + droppableMargin.right,
          bottom: container.bottom + droppableMargin.bottom,
          left: container.left - droppableMargin.left,
        };
        const expected = {
          ...expectedSpacing,
          center: getCenter(expectedSpacing),
          height: expectedSpacing.bottom - expectedSpacing.top,
          width: expectedSpacing.right - expectedSpacing.left,
        };

        expect(droppableDimension.container.bounds)
          .toEqual(expected);
        expect(droppableDimensionNoContainerProvided.container.bounds)
          .toEqual(expected);
      });
    });
  });
});
