// @flow
import getDroppableOver from '../../../src/state/get-droppable-over';
import { getDroppableDimension } from '../../../src/state/dimension';
import getClientRect from '../../../src/state/get-client-rect';
import type {
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
} from '../../../src/types';

const droppable1: DroppableDimension = getDroppableDimension({
  id: 'drop-1',
  clientRect: getClientRect({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
  }),
});

const droppable2: DroppableDimension = getDroppableDimension({
  id: 'drop-2',
  clientRect: getClientRect({
    top: 101,
    left: 0,
    bottom: 200,
    right: 100,
  }),
});

const droppableMap: DroppableDimensionMap = {
  [droppable1.id]: droppable1,
  [droppable2.id]: droppable2,
};

// Most functionality is tested by get getInsideDimension
describe('get droppable over', () => {
  it('should return null if the target is not over any dimension', () => {
    const target: Position = {
      x: 1000,
      y: 1000,
    };

    const result: ?DroppableId = getDroppableOver(target, droppableMap);

    expect(result).toBe(null);
  });

  it('should return the droppable dimension that the target is over', () => {
    const target: Position = {
      x: 10,
      y: 10,
    };

    const result: ?DroppableId = getDroppableOver(target, droppableMap);

    expect(result).toBe(droppable1.id);
  });
});
