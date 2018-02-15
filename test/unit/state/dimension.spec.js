// @flow
import {
  getDraggableDimension,
  getDroppableDimension,
  scrollDroppable,
  clip,
} from '../../../src/state/dimension';
import { vertical, horizontal } from '../../../src/state/axis';
import { offsetByPosition } from '../../../src/state/spacing';
import getArea from '../../../src/state/get-area';
import { negate } from '../../../src/state/position';
import getMaxScroll from '../../../src/state/get-max-scroll';
import { getClosestScrollable } from '../../utils/dimension';
import type {
  Area,
  Spacing,
  DroppableDescriptor,
  DraggableDescriptor,
  Position,
  DraggableDimension,
  DroppableDimension,
  ClosestScrollable,
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
    const dimension: DroppableDimension = getDroppableDimension({
      descriptor: droppableDescriptor,
      client,
      margin,
      padding,
      windowScroll,
    });

    it('should apply the correct axis', () => {
      const withDefault: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client,
        margin,
        windowScroll,
      });
      const withVertical: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client,
        margin,
        windowScroll,
        direction: 'vertical',
      });
      const withHorizontal: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client,
        margin,
        windowScroll,
        direction: 'horizontal',
      });

      // default uses vertical
      expect(withDefault.axis).toBe(vertical);
      // explicit vertical
      expect(withVertical.axis).toBe(vertical);
      // explicit horizontal
      expect(withHorizontal.axis).toBe(horizontal);
    });

    describe('without window scroll (client)', () => {
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

    describe('with window scroll (page)', () => {
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
          bottom: (client.bottom + windowScroll.y) + margin.bottom + padding.bottom,
          right: (client.right + windowScroll.x) + margin.right + padding.right,
        });

        expect(dimension.page.withMarginAndPadding).toEqual(area);
      });
    });

    describe('closest scrollable', () => {
      describe('basic info about the scrollable', () => {
        const client: Area = getArea({
          top: 0,
          right: 300,
          bottom: 300,
          left: 0,
        });
        const frameClient: Area = getArea({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        });

        const withScrollable: DroppableDimension = getDroppableDimension({
          descriptor: droppableDescriptor,
          client,
          windowScroll,
          closest: {
            frameClient,
            scrollWidth: 500,
            scrollHeight: 500,
            scroll: { x: 10, y: 10 },
            shouldClipSubject: true,
          },
        });

        it('should not have a closest scrollable if there is no closest scrollable', () => {
          const noClosestScrollable: DroppableDimension = getDroppableDimension({
            descriptor: droppableDescriptor,
            client,
          });

          expect(noClosestScrollable.viewport.closestScrollable).toBe(null);
          expect(noClosestScrollable.viewport.subject)
            .toEqual(noClosestScrollable.viewport.clipped);
        });

        it('should offset the frame client by the window scroll', () => {
          expect(getClosestScrollable(withScrollable).frame).toEqual(
            getArea(offsetByPosition(frameClient, windowScroll))
          );
        });

        it('should set the max scroll point for the closest scrollable', () => {
          expect(getClosestScrollable(withScrollable).scroll.max).toEqual({ x: 400, y: 400 });
        });
      });

      describe('frame clipping', () => {
        const frameClient = getArea({
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
        });
        const getWithClient = (subject: Area): DroppableDimension => getDroppableDimension({
          descriptor: droppableDescriptor,
          client: subject,
          closest: {
            frameClient,
            scrollWidth: 300,
            scrollHeight: 300,
            scroll: origin,
            shouldClipSubject: true,
          },
        });

        it('should not clip the frame if requested not to', () => {
          const withoutClipping: DroppableDimension = getDroppableDimension({
            descriptor: droppableDescriptor,
            client,
            windowScroll,
            closest: {
              frameClient,
              scrollWidth: 300,
              scrollHeight: 300,
              scroll: origin,
              // disabling clipping
              shouldClipSubject: false,
            },
          });

          expect(withoutClipping.viewport.subject).toEqual(withoutClipping.viewport.clipped);

          expect(getClosestScrollable(withoutClipping).shouldClipSubject).toBe(false);
        });

        describe('frame is smaller than subject', () => {
          it('should clip the subject to the size of the frame', () => {
            const subject = getArea({
              top: 0,
              left: 0,
              // 100px bigger than the frame on the bottom and right
              bottom: 200,
              right: 200,
            });

            const droppable: DroppableDimension = getWithClient(subject);

            expect(droppable.viewport.clipped).toEqual(frameClient);
          });
        });

        describe('frame is larger than subject', () => {
          it('should return a clipped size that is equal to that of the subject', () => {
            // 10px smaller on every side
            const subject = getArea({
              top: 10,
              right: 90,
              bottom: 90,
              left: 10,
            });

            const droppable: DroppableDimension = getWithClient(subject);

            expect(droppable.viewport.clipped).toEqual(subject);
          });
        });

        describe('subject clipped on one side by frame', () => {
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
              const droppable: DroppableDimension = getWithClient(subject);

              expect(droppable.viewport.clipped).toEqual(frameClient);
            });
          });
        });
      });
    });
  });

  describe('scrolling a droppable', () => {
    it('should update the frame scroll and the clipping', () => {
      const scrollSize = {
        scrollHeight: 500,
        scrollWidth: 100,
      };
      const subject = getArea({
        // 500 px high
        top: 0,
        bottom: scrollSize.scrollHeight,
        right: scrollSize.scrollWidth,
        left: 0,
      });
      const frameClient = getArea({
        // only viewing top 100px
        bottom: 100,
        // unchanged
        top: 0,
        right: scrollSize.scrollWidth,
        left: 0,
      });
      const frameScroll: Position = { x: 0, y: 0 };
      const droppable: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client: subject,
        closest: {
          frameClient,
          scroll: frameScroll,
          scrollWidth: scrollSize.scrollWidth,
          scrollHeight: scrollSize.scrollHeight,
          shouldClipSubject: true,
        },
      });

      const closestScrollable: ClosestScrollable = getClosestScrollable(droppable);

      // original frame
      expect(closestScrollable.frame).toEqual(frameClient);
      // subject is currently clipped by the frame
      expect(droppable.viewport.clipped).toEqual(frameClient);

      // scrolling down
      const newScroll: Position = { x: 0, y: 100 };
      const updated: DroppableDimension = scrollDroppable(droppable, newScroll);
      const updatedClosest: ClosestScrollable = getClosestScrollable(updated);

      // unchanged frame client
      expect(updatedClosest.frame).toEqual(frameClient);

      // updated scroll info
      expect(updatedClosest.scroll).toEqual({
        initial: frameScroll,
        current: newScroll,
        diff: {
          value: newScroll,
          displacement: negate(newScroll),
        },
        max: getMaxScroll({
          scrollWidth: scrollSize.scrollWidth,
          scrollHeight: scrollSize.scrollHeight,
          width: frameClient.width,
          height: frameClient.height,
        }),
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

    it('should increase the max scroll position if the requested scroll is bigger than the max', () => {
      const scrollable: DroppableDimension = getDroppableDimension({
        descriptor: droppableDescriptor,
        client: getArea({
          top: 0,
          left: 0,
          right: 200,
          bottom: 200,
        }),
        closest: {
          frameClient: getArea({
            top: 0,
            left: 0,
            right: 100,
            bottom: 100,
          }),
          scroll: { x: 0, y: 0 },
          scrollWidth: 200,
          scrollHeight: 200,
          shouldClipSubject: true,
        },
      });

      const scrolled: DroppableDimension = scrollDroppable(scrollable, { x: 300, y: 300 });

      expect(getClosestScrollable(scrolled).scroll.max).toEqual({ x: 300, y: 300 });
      // original max
      expect(getClosestScrollable(scrollable).scroll.max).toEqual({ x: 100, y: 100 });
    });
  });

  describe('subject clipping', () => {
    it('should select clip a subject in a frame', () => {
      const subject: Area = getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      const frame: Area = getArea({
        top: 20,
        left: 20,
        right: 50,
        bottom: 50,
      });

      expect(clip(frame, subject)).toEqual(frame);
    });

    it('should return null when the subject it outside the frame on any side', () => {
      const frame: Area = getArea({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      const outside: Spacing[] = [
        // top
        offsetByPosition(frame, { x: 0, y: -200 }),
        // right
        offsetByPosition(frame, { x: 200, y: 0 }),
        // bottom
        offsetByPosition(frame, { x: 0, y: 200 }),
        // left
        offsetByPosition(frame, { x: -200, y: 0 }),
      ];

      outside.forEach((subject: Spacing) => {
        expect(clip(frame, subject)).toEqual(null);
      });
    });
  });
});
