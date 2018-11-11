// @flow
import memoizeOne from 'memoize-one';
import { toDraggableList } from './dimension-structures';
import type {
  DraggableDimension,
  DroppableId,
  DraggableDimensionMap,
} from '../types';

export default memoizeOne(
  (
    // using droppableId to avoid cache busted when we
    // update the droppable (such as when it scrolls)
    droppableId: DroppableId,
    draggables: DraggableDimensionMap,
  ): DraggableDimension[] => {
    const result = toDraggableList(draggables)
      .filter(
        (draggable: DraggableDimension): boolean =>
          droppableId === draggable.descriptor.droppableId,
      )
      // Dimensions are not guarenteed to be ordered in the same order as keys
      // So we need to sort them so they are in the correct order
      .sort(
        (a: DraggableDimension, b: DraggableDimension): number =>
          a.descriptor.index - b.descriptor.index,
      );

    return result;
  },
);
