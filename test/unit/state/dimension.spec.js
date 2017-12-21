// @flow
import {
  getDraggableDimension,
  getDroppableDimension,
  scrollDroppable,
} from '../../../src/state/dimension';
import { vertical, horizontal } from '../../../src/state/axis';
import getArea from '../../../src/state/get-area';
import { negate } from '../../../src/state/position';
import type {
  Area,
  Spacing,
  DroppableDescriptor,
  DraggableDescriptor,
  Position,
  DraggableDimension,
  DroppableDimension,
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

const client: Area = getArea({
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

const addPosition = (area: Area, point: Position): Area => {
  const { top, right, bottom, left } = area;
  return getArea({
    top: top + point.y,
    left: left + point.x,
    bottom: bottom + point.y,
    right: right + point.x,
  });
};

const addSpacing = (area: Area, spacing: Spacing): Area => {
  const { top, right, bottom, left } = area;
  return getArea({
    // pulling back to increase size
    top: top - spacing.top,
    left: left - spacing.left,
    // pushing forward to increase size
    bottom: bottom + spacing.bottom,
    right: right + spacing.right,
  });
};

describe('dimension', () => {
  describe('draggable dimension', () => {
    const dimension: DraggableDimension = getDraggableDimension({
      descriptor: draggableDescriptor,
      client,
      margin,
      windowScroll,
    });

    describe('without scroll (client)', () => {
      it('should return a portion that does not account for margins', () => {
        const area: Area = getArea({
          top: client.top,
          right: client.right,
          bottom: client.bottom,
          left: client.left,
        });

        expect(dimension.client.withoutMargin).toEqual(area);
      });

      it('should return a portion that considers margins', () => {
        const area: Area = getArea({
          top: client.top - margin.top,
          right: client.right + margin.right,
          bottom: client.bottom + margin.bottom,
          left: client.left - margin.left,
        });

        expect(dimension.client.withMargin).toEqual(area);
      });
    });

    describe('with scroll (page)', () => {
      it('should return a portion that does not account for margins', () => {
        const area: Area = getArea({
          top: client.top + windowScroll.y,
          right: client.right + windowScroll.x,
          bottom: client.bottom + windowScroll.y,
          left: client.left + windowScroll.x,
        });

        expect(dimension.page.withoutMargin).toEqual(area);
      });

      it('should return a portion that considers margins', () => {
        const area: Area = getArea({
          top: (client.top - margin.top) + windowScroll.y,
          right: client.right + margin.right + windowScroll.x,
          bottom: client.bottom + margin.bottom + windowScroll.y,
          left: (client.left - margin.left) + windowScroll.x,
        });

        expect(dimension.page.withMargin).toEqual(area);
      });
    });
  });

  describe('droppable dimension', () => {
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
        diff: {
          value: origin,
          displacement: origin,
        },
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
        const area: Area = getArea({
          top: client.top,
          right: client.right,
          bottom: client.bottom,
          left: client.left,
        });

        expect(dimension.client.withoutMargin).toEqual(area);
      });

      it('should return a portion that does consider margins', () => {
        const area: Area = getArea({
          top: client.top - margin.top,
          left: client.left - margin.left,
          bottom: client.bottom + margin.bottom,
          right: client.right + margin.right,
        });

        expect(dimension.client.withMargin).toEqual(area);
      });

      it('should return a portion that considers margins and padding', () => {
        const area: Area = getArea({
          top: client.top - margin.top - padding.top,
          left: client.left - margin.left - padding.left,
          bottom: client.bottom + margin.bottom + padding.bottom,
          right: client.right + margin.right + padding.right,
        });

        expect(dimension.client.withMarginAndPadding).toEqual(area);
      });
    });

    describe('with scroll (page)', () => {
      it('should return a portion that does not consider margins', () => {
        const area: Area = getArea({
          top: client.top + windowScroll.y,
          left: client.left + windowScroll.x,
          bottom: client.bottom + windowScroll.y,
          right: client.right + windowScroll.x,
        });

        expect(dimension.page.withoutMargin).toEqual(area);
      });

      it('should return a portion that does consider margins', () => {
        const area: Area = getArea({
          top: (client.top + windowScroll.y) - margin.top,
          left: (client.left + windowScroll.x) - margin.left,
          bottom: client.bottom + windowScroll.y + margin.bottom,
          right: client.right + windowScroll.x + margin.right,
        });

        expect(dimension.page.withMargin).toEqual(area);
      });

      it('should return a portion that considers margins and padding', () => {
        const area: Area = getArea({
          top: (client.top + windowScroll.y) - margin.top - padding.top,
          left: (client.left + windowScroll.x) - margin.left - padding.left,
          bottom: client.bottom + windowScroll.y + margin.bottom + padding.bottom,
          right: client.right + windowScroll.x + margin.right + padding.right,
        });

        expect(dimension.page.withMarginAndPadding).toEqual(area);
      });
    });

    describe('viewport', () => {
      it('should use the area as the frame if no frame is provided', () => {
        const droppable: DroppableDimension = getDroppableDimension({
          descriptor: droppableDescriptor,
          client,
          margin,
          windowScroll: origin,
          frameScroll,
        });

        expect(droppable.viewport.frame).toEqual(addSpacing(client, margin));
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
          addPosition(addSpacing(client, margin), windowScroll),
        );
      });

      it('should use the frameClient as the frame if provided', () => {
        const frameClient: Area = getArea({
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
            const subject = getArea({
              top: 0,
              right: 100,
              bottom: 100,
              left: 0,
            });
            const frameClient = getArea({
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

            expect(droppable.viewport.clipped).toEqual(frameClient);
          });
        });

        describe('frame is larger than subject', () => {
          it('should return a clipped size that is equal to that of the subject', () => {
            const frameClient = getArea({
              top: 0,
              right: 100,
              bottom: 100,
              left: 0,
            });
            const subject = getArea({
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

            expect(droppable.viewport.clipped).toEqual(subject);
          });
        });

        describe('subject clipped on one side by frame', () => {
          const frameClient = getArea({
            top: 0,
            right: 100,
            bottom: 100,
            left: 0,
          });

          it('should clip on all sides', () => {
            // each of these subjects bleeds out past the frame in one direction
            const subjects: Area[] = [
              getArea({
                ...frameClient,
                top: -10,
              }),
              getArea({
                ...frameClient,
                right: 110,
              }),
              getArea({
                ...frameClient,
                bottom: 110,
              }),
              getArea({
                ...frameClient,
                left: -10,
              }),
            ];

            subjects.forEach((subject: Area) => {
              const droppable: DroppableDimension = getDroppableDimension({
                descriptor: droppableDescriptor,
                client: subject,
                frameClient,
              });

              expect(droppable.viewport.clipped).toEqual(frameClient);
            });
          });
        });
      });
    });
  });

  describe('scrolling a droppable', () => {
    it('should update the frame scroll and the clipping', () => {
      const subject = getArea({
        // 500 px high
        top: 0,
        bottom: 500,
        right: 100,
        left: 0,
      });
      const frameClient = getArea({
        // only viewing top 100px
        top: 0,
        bottom: 100,
        // unchanged
        right: 100,
        left: 0,
      });
      const frameScroll: Position = { x: 0, y: 0 };
      const droppable: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client: subject,
        frameClient,
        frameScroll,
      });

      // original frame
      expect(droppable.viewport.frame).toEqual(frameClient);
      // subject is currently clipped by the frame
      expect(droppable.viewport.clipped).toEqual(frameClient);

      // scrolling down
      const newScroll: Position = { x: 0, y: 100 };
      const updated: DroppableDimension = scrollDroppable(droppable, newScroll);

      // unchanged frame client
      expect(updated.viewport.frame).toEqual(frameClient);

      // updated scroll info
      expect(updated.viewport.frameScroll).toEqual({
        initial: frameScroll,
        current: newScroll,
        diff: {
          value: newScroll,
          displacement: negate(newScroll),
        },
      });

      // updated clipped
      // can now see the bottom half of the subject
      expect(updated.viewport.clipped).toEqual(getArea({
        top: 0,
        bottom: 100,
        // unchanged
        right: 100,
        left: 0,
      }));
    });
  });
});
