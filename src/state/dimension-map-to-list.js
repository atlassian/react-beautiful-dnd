// @flow
import memoizeOne from 'memoize-one';
import type {
  DraggableId,
  DroppableId,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../types';

export const droppableMapToList = memoizeOne(
  (droppables: DroppableDimensionMap) =>
    Object.keys(droppables).map((id: DroppableId) => droppables[id])
);

export const draggableMapToList = memoizeOne(
  (draggables: DraggableDimensionMap) =>
    Object.keys(draggables).map((id: DraggableId) => draggables[id])
);
