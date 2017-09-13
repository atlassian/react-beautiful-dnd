// @flow
import memoizeOne from 'memoize-one';
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../types';

export default memoizeOne(
  (droppable: DroppableDimension,
    draggables: DraggableDimensionMap,
  ): DraggableDimension[] =>
    Object.keys(draggables)
      .map((id: DraggableId): DraggableDimension => draggables[id])
      .filter((draggable: DraggableDimension): boolean => (
        droppable.id === draggable.droppableId
      ))
      // Dimensions are not guarenteed to be ordered in the same order as keys
      // So we need to sort them so they are in the correct order
      .sort((a: DraggableDimension, b: DraggableDimension): number => (
        a.page.withoutMargin.center[droppable.axis.line] -
        b.page.withoutMargin.center[droppable.axis.line]
      ))
);
