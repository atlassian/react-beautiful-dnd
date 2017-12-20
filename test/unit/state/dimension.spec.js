// @flow
import {
  getDraggableDimension,
  getDroppableDimension,
  getFragment,
} from '../../../src/state/dimension';
import { vertical, horizontal } from '../../../src/state/axis';
import getClientRect, { getWithPosition, getWithSpacing } from '../../../src/state/get-client-rect';
import type {
  ClientRect,
  Spacing,
  DroppableDescriptor,
  DraggableDescriptor,
  Position,
  DraggableDimension,
  DroppableDimension,
  DimensionFragment,
} from '../../../src/types';

const droppableDescriptor: DroppableDescriptor = {
  id: 'drop-1',
  type: 'TYPE',
};
const draggableDescriptor: DraggableDescriptor = {
  id: 'drag-1',
  droppableId: droppableDescriptor.id,
  index: 0,
};

const client: ClientRect = getClientRect({
  top: 10,
  right: 110,
  bottom: 90,
  left: 20,
});
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
const origin: Position = { x: 0, y: 0 };

const getCenter = (rect: ClientRect | Spacing): Position => ({
  x: (rect.left + rect.right) / 2,
  y: (rect.top + rect.bottom) / 2,
});

describe('dimension', () => {
  describe('draggable dimension', () => {
    const dimension: DraggableDimension = getDraggableDimension({
      id: draggableId,
      droppableId,
      client,
      margin,
      windowScroll,
    });

    describe('without scroll (client)', () => {
      it('should return a portion that does not account for margins', () => {
        const fragment: DimensionFragment = {
          top: client.top,
          right: client.right,
          bottom: client.bottom,
          left: client.left,
          width: client.width,
          height: client.height,
          center: {
            x: (client.left + client.right) / 2,
            y: (client.top + client.bottom) / 2,
          },
        };
        expect(dimension.client.withoutMargin).toEqual(fragment);
      });

      it('should return a portion that considers margins', () => {
        const rect: ClientRect = getClientRect({
          top: client.top - margin.top,
          right: client.right + margin.right,
          bottom: client.bottom + margin.bottom,
          left: client.left - margin.left,
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
        const top: number = client.top + windowScroll.y;
        const right: number = client.right + windowScroll.x;
        const bottom: number = client.bottom + windowScroll.y;
        const left: number = client.left + windowScroll.x;

        const fragment: DimensionFragment = {
          top,
          right,
          bottom,
          left,
          width: client.width,
          height: client.height,
          center: {
            x: (left + right) / 2,
            y: (top + bottom) / 2,
          },
        };
        expect(dimension.page.withoutMargin).toEqual(fragment);
      });

      it('should return a portion that considers margins', () => {
        const rect: ClientRect = getClientRect({
          top: (client.top - margin.top) + windowScroll.y,
          right: client.right + margin.right + windowScroll.x,
          bottom: client.bottom + margin.bottom + windowScroll.y,
          left: (client.left - margin.left) + windowScroll.x,
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

  describe.only('droppable dimension', () => {
    const frameScroll: Position = {
      x: 10,
      y: 20,
    };

    const dimension: DroppableDimension = getDroppableDimension({
      descriptor: droppableDescriptor,
      client,
      margin,
      padding,
      windowScroll,
      frameScroll,
    });

    it('should return the initial scroll as the initial and current scroll', () => {
      expect(dimension.viewport.frameScroll).toEqual({
        initial: frameScroll,
        current: frameScroll,
        diff: origin,
      });
    });

    it('should apply the correct axis', () => {
      const withDefault: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client,
        margin,
        windowScroll,
        frameScroll,
      });
      const withVertical: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client,
        margin,
        windowScroll,
        frameScroll,
        direction: 'vertical',
      });
      const withHorizontal: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client,
        margin,
        windowScroll,
        frameScroll,
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
          top: client.top,
          right: client.right,
          bottom: client.bottom,
          left: client.left,
          width: client.width,
          height: client.height,
          center: getCenter(client),
        };

        expect(dimension.client.withoutMargin).toEqual(fragment);
      });

      it('should return a portion that does consider margins', () => {
        const rect: ClientRect = getClientRect({
          top: client.top - margin.top,
          left: client.left - margin.left,
          bottom: client.bottom + margin.bottom,
          right: client.right + margin.right,
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
          top: client.top - margin.top - padding.top,
          left: client.left - margin.left - padding.left,
          bottom: client.bottom + margin.bottom + padding.bottom,
          right: client.right + margin.right + padding.right,
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
          top: client.top + windowScroll.y,
          left: client.left + windowScroll.x,
          bottom: client.bottom + windowScroll.y,
          right: client.right + windowScroll.x,
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
          top: (client.top + windowScroll.y) - margin.top,
          left: (client.left + windowScroll.x) - margin.left,
          bottom: client.bottom + windowScroll.y + margin.bottom,
          right: client.right + windowScroll.x + margin.right,
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
          top: (client.top + windowScroll.y) - margin.top - padding.top,
          left: (client.left + windowScroll.x) - margin.left - padding.left,
          bottom: client.bottom + windowScroll.y + margin.bottom + padding.bottom,
          right: client.right + windowScroll.x + margin.right + padding.right,
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

    describe.only('viewport', () => {
      it('should use the client rect as the frame if no frame is provided', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: droppableDescriptor,
          client,
          margin,
          windowScroll: origin,
          frameScroll,
        });

        expect(droppable.viewport.frame).toEqual(getWithSpacing(client, margin));
      });

      it('should include the window scroll', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: droppableDescriptor,
          client,
          margin,
          windowScroll,
          frameScroll,
        });

        expect(droppable.viewport.frame).toEqual(
          getWithPosition(getWithSpacing(client, margin), windowScroll),
        );
      });

      it('should use the frame rect as the frame if provided', () => {
        const frameClient: ClientRect = getClientRect({
          top: 20,
          left: 30,
          right: 40,
          bottom: 50,
        });

        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: droppableDescriptor,
          client,
          frameClient,
        });

        expect(droppable.viewport.frame).toEqual(frameClient);
      });

      describe('frame clipping', () => {
        describe('frame is smaller than subject', () => {
          it('should clip the subject to the size of the frame', () => {
            const subject = getClientRect({
              top: 0,
              right: 100,
              bottom: 100,
              left: 0,
            });
            const frameClient = getClientRect({
              top: 10,
              right: 90,
              bottom: 90,
              left: 10,
            });

            const droppable: DroppableDimension = getDroppableDimension({
              descriptor: droppableDescriptor,
              client: subject,
              frameClient,
            });

            expect(droppable.viewport.clipped).toEqual(getFragment(frameClient));
          });
        });

        describe('frame is larger than subject', () => {
          it('should return a clipped size that is equal to that of the subject', () => {
            const frameClient = getClientRect({
              top: 0,
              right: 100,
              bottom: 100,
              left: 0,
            });
            const subject = getClientRect({
              top: 10,
              right: 90,
              bottom: 90,
              left: 10,
            });

            const droppable: DroppableDimension = getDroppableDimension({
              descriptor: droppableDescriptor,
              client: subject,
              frameClient,
            });

            expect(droppable.viewport.clipped).toEqual(getFragment(subject));
          });
        });
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

  describe('scroll droppable', () => {

  });
});
