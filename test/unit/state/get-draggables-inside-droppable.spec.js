// @flow
import getDraggablesInsideDroppable from '../../../src/state/get-draggables-inside-droppable';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import getArea from '../../../src/state/get-area';
import type {
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../../src/types';

const droppableId: DroppableId = 'drop-1';
const otherDroppableId: DroppableId = 'drop-2';

describe('get draggables inside a droppable', () => {
  const droppable: DroppableDimension = getDroppableDimension({
    id: droppableId,
    clientRect: getArea({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    }),
  });

  const inside1: DraggableDimension = getDraggableDimension({
    id: 'inside-1',
    droppableId,
    clientRect: getArea({
      top: 20,
      left: 20,
      right: 80,
      bottom: 30,
    }),
  });

  const inside2: DraggableDimension = getDraggableDimension({
    id: 'inside-2',
    droppableId,
    clientRect: getArea({
      top: 31,
      left: 30,
      right: 70,
      bottom: 40,
    }),
  });

  const inside3: DraggableDimension = getDraggableDimension({
    id: 'inside-3',
    droppableId,
    clientRect: getArea({
      top: 41,
      left: 30,
      right: 70,
      bottom: 50,
    }),
  });

  const outside: DraggableDimension = getDraggableDimension({
    id: 'outside-1',
    droppableId: otherDroppableId,
    clientRect: getArea({
      top: 200,
      left: 200,
      right: 300,
      bottom: 400,
    }),
  });

  const getDraggableDimensionMap = (dimensions: DraggableDimension[]): DraggableDimensionMap =>
    dimensions.reduce(
      (previous: DraggableDimensionMap, current: DraggableDimension): DraggableDimensionMap => {
        previous[current.id] = current;
        return previous;
      }, {},
    );

  it('should only return dimensions that are inside a droppable', () => {
    const all: DraggableDimension[] = [inside1, inside2, inside3, outside];

    const result: DraggableDimension[] = getDraggablesInsideDroppable(
      droppable, getDraggableDimensionMap(all),
    );

    expect(result).toEqual([inside1, inside2, inside3]);
  });

  it('should order the dimensions in their vertical order', () => {
    const unordered: DraggableDimension[] = [inside2, inside3, inside1];

    const result: DraggableDimension[] = getDraggablesInsideDroppable(
      droppable, getDraggableDimensionMap(unordered),
    );

    expect(result).toEqual([inside1, inside2, inside3]);
  });
});
