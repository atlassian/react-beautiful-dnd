// @flow
import type { Position } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../../../../src/types';
import {
  getDroppableDimension,
  getDraggableDimension,
} from '../../../../utils/dimension';
import { getRequiredGrowthForPlaceholder } from '../../../../../src/state/droppable/with-placeholder';
import { toDraggableMap } from '../../../../../src/state/dimension-structures';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { patch } from '../../../../../src/state/position';

const crossAxisStart: number = 0;
const crossAxisEnd: number = 100;
const size: number = 200;
const gap: number = 10;

[vertical, horizontal].forEach((axis: Axis) => {
  describe(`on ${axis.direction} axis`, () => {
    const droppable: DroppableDimension = getDroppableDimension({
      descriptor: {
        id: 'foo',
        type: 'TYPE',
      },
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
        droppableId: droppable.descriptor.id,
        type: droppable.descriptor.type,
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
        droppableId: droppable.descriptor.id,
        type: droppable.descriptor.type,
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

    it('should not grow the subject if there is enough available space', () => {
      const placeholderSize: Position = patch(axis.line, gap - 5);

      const result: ?Position = getRequiredGrowthForPlaceholder(
        droppable,
        placeholderSize,
        draggables,
      );

      expect(result).toEqual(null);
    });

    it('should grow the subject by the space required for the placeholder', () => {
      const excess: number = 20;
      const placeholderSize: Position = patch(axis.line, gap + excess);

      const result: ?Position = getRequiredGrowthForPlaceholder(
        droppable,
        placeholderSize,
        draggables,
      );

      expect(result).toEqual(patch(axis.line, excess));
    });
  });
});
