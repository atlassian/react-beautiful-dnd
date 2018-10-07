// @flow
import invariant from 'tiny-invariant';
import { type Position, type Rect, getRect } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableSubject,
  DroppableDescriptor,
  Scrollable,
} from '../../../../src/types';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../utils/dimension';
import {
  addPlaceholder,
  removePlaceholder,
} from '../../../../src/state/droppable/with-placeholder';
import { toDraggableMap } from '../../../../src/state/dimension-structures';
import { vertical, horizontal } from '../../../../src/state/axis';
import { add, patch, origin, isEqual } from '../../../../src/state/position';

const crossAxisStart: number = 0;
const crossAxisEnd: number = 100;
const crossAxisSize: number = crossAxisEnd - crossAxisStart;
const size: number = 200;
const gap: number = 10;

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const descriptor: DroppableDescriptor = {
      id: 'foo',
      type: 'TYPE',
    };
    const withoutFrame: DroppableDimension = getDroppableDimension({
      descriptor,
      direction: axis.direction,
      borderBox: {
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 0,
        [axis.end]: size,
      },
    });
    const draggable1: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'draggable-1',
        index: 0,
        payload: null,
        droppableId: descriptor.id,
        type: descriptor.type,
      },
      borderBox: {
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: 0,
        [axis.end]: size / 2,
      },
    });

    const draggable2: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'draggable-2',
        index: 1,
        payload: null,
        droppableId: descriptor.id,
        type: descriptor.type,
      },
      borderBox: {
        [axis.crossAxisStart]: crossAxisStart,
        [axis.crossAxisEnd]: crossAxisEnd,
        [axis.start]: size / 2,
        // leave a little gap before the end
        [axis.end]: size - gap,
      },
    });
    const draggables: DraggableDimensionMap = toDraggableMap([
      draggable1,
      draggable2,
    ]);

    describe('without frame', () => {
      describe('adding placeholder', () => {
        it('should not grow the subject if not required', () => {
          const placeholderSize: Position = patch(axis.line, gap - 5);

          const result: DroppableDimension = addPlaceholder(
            withoutFrame,
            placeholderSize,
            draggables,
          );

          const expected: DroppableSubject = {
            // unchanged
            pageMarginBox: withoutFrame.subject.pageMarginBox,
            active: withoutFrame.subject.active,
            // added
            withPlaceholder: {
              increasedBy: null,
              oldFrameMaxScroll: null,
              placeholderSize,
            },
          };
          expect(result.subject).toEqual(expected);
        });

        it('should grow the subject if required', () => {
          const excess: number = 20;
          const placeholderSize: Position = patch(axis.line, gap + excess);

          const result: DroppableDimension = addPlaceholder(
            withoutFrame,
            placeholderSize,
            draggables,
          );

          const active: ?Rect = withoutFrame.subject.active;
          invariant(active);
          const expected: DroppableSubject = {
            // unchanged
            pageMarginBox: withoutFrame.subject.pageMarginBox,
            // increased
            active: getRect({
              ...active,
              [axis.end]: active[axis.end] + excess,
            }),
            // added
            withPlaceholder: {
              increasedBy: patch(axis.line, excess),
              oldFrameMaxScroll: null,
              placeholderSize,
            },
          };
          expect(result.subject).toEqual(expected);
        });
      });

      it('should restore the subject to its original size when placeholder is no longer needed', () => {
        const excess: number = 20;
        const placeholderSize: Position = patch(axis.line, gap + excess);

        const added: DroppableDimension = addPlaceholder(
          withoutFrame,
          placeholderSize,
          draggables,
        );
        const removed: DroppableDimension = removePlaceholder(added);

        expect(removed).toEqual(withoutFrame);
      });
    });

    describe('with frame', () => {
      const withFrame: DroppableDimension = getDroppableDimension({
        descriptor,
        direction: axis.direction,
        borderBox: withoutFrame.client.borderBox,
        closest: {
          borderBox: withoutFrame.client.borderBox,
          scrollSize: {
            scrollWidth: axis === vertical ? crossAxisSize : size,
            scrollHeight: axis === vertical ? size : crossAxisSize,
          },
          scroll: origin,
          shouldClipSubject: false,
        },
      });
      const originalFrame: ?Scrollable = withFrame.frame;
      invariant(
        originalFrame && isEqual(originalFrame.scroll.max, origin),
        'expecting no max scroll',
      );

      it('should not grow the subject if not required', () => {
        const placeholderSize: Position = patch(axis.line, gap - 5);

        const result: DroppableDimension = addPlaceholder(
          withFrame,
          placeholderSize,
          draggables,
        );

        const expected: DroppableSubject = {
          // unchanged
          pageMarginBox: withFrame.subject.pageMarginBox,
          active: withFrame.subject.active,
          // added
          withPlaceholder: {
            increasedBy: null,
            // holding onto old max regardless
            oldFrameMaxScroll: originalFrame.scroll.max,
            placeholderSize,
          },
        };
        expect(result.subject).toEqual(expected);
        // no change in frame or scroll
        const newFrame: ?Scrollable = result.frame;
        invariant(newFrame);
        expect(originalFrame.scroll.max).toEqual(newFrame.scroll.max);
        expect(originalFrame).toEqual(newFrame);
      });

      it('should grow the subject if required', () => {
        const excess: number = 20;
        const placeholderSize: Position = patch(axis.line, gap + excess);

        const result: DroppableDimension = addPlaceholder(
          withFrame,
          placeholderSize,
          draggables,
        );

        const increasedBy: Position = patch(axis.line, excess);
        const active: ?Rect = withFrame.subject.active;
        invariant(active);
        const expected: DroppableSubject = {
          // unchanged
          pageMarginBox: withFrame.subject.pageMarginBox,
          // increased
          active: getRect({
            ...active,
            [axis.end]: active[axis.end] + excess,
          }),
          // added
          withPlaceholder: {
            increasedBy,
            oldFrameMaxScroll: originalFrame.scroll.max,
            placeholderSize,
          },
        };
        expect(result.subject).toEqual(expected);
        // max scroll change
        const newFrame: ?Scrollable = result.frame;
        invariant(newFrame);
        expect(originalFrame.scroll.max).not.toEqual(newFrame.scroll.max);
        expect(newFrame.scroll.max).toEqual(
          add(originalFrame.scroll.max, increasedBy),
        );
        // no client change
        expect(newFrame.frameClient).toEqual(newFrame.frameClient);
      });

      it('should restore the original frame when placeholder is no longer needed', () => {
        const excess: number = 20;
        const placeholderSize: Position = patch(axis.line, gap + excess);

        const added: DroppableDimension = addPlaceholder(
          withFrame,
          placeholderSize,
          draggables,
        );
        const removed: DroppableDimension = removePlaceholder(added);

        expect(removed).toEqual(withFrame);
      });
    });
  });
});
