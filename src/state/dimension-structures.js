// @flow
import type {
  DroppableId,
  DraggableId,
  DroppableDimension,
  DroppableDimensionMap,
  DraggableDimension,
  DraggableDimensionMap,
} from '../types';

export const toDroppableMap =
  (droppables: DroppableDimension[]): DroppableDimensionMap =>
    droppables.reduce((previous, current) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

export const toDraggableMap =
  (draggables: DraggableDimension[]): DraggableDimensionMap =>
    draggables.reduce((previous, current) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

export const toDroppableList =
  (droppables: DroppableDimensionMap): DroppableDimension[] =>
    Object.keys(droppables).map((id: DroppableId): DroppableDimension => droppables[id]);

export const toDraggableList =
  (draggables: DraggableDimensionMap): DraggableDimension[] =>
    Object.keys(draggables).map((id: DraggableId): DraggableDimension => draggables[id]);
