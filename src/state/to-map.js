// @flow
import type {
  DroppableDimension,
  DroppableDimensionMap,
  DraggableDimension,
  DraggableDimensionMap,
} from '../types';

const reduce = (dimensions: any) => dimensions.reduce((previous, current) => {
  previous[current.descriptor.id] = current;
  return previous;
}, {});

export const toDroppableMap =
  (droppables: DroppableDimension[]): DroppableDimensionMap => reduce(droppables);

export const toDraggableMap =
  (draggables: DraggableDimension[]): DraggableDimensionMap => reduce(draggables);
