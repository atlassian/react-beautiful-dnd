// @flow
import memoizeOne from 'memoize-one';
import { toDraggableList } from './dimension-structures';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../types';

export default memoizeOne(
  (
    droppable: DroppableDimension,
    draggables: DraggableDimensionMap,
  ): DraggableDimension[] => {
    const result = toDraggableList(draggables)
      .filter(
        (draggable: DraggableDimension): boolean =>
          droppable.descriptor.id === draggable.descriptor.droppableId,
      )
      // Dimensions are not guarenteed to be ordered in the same order as keys
      // So we need to sort them so they are in the correct order
      .sort(
        (a: DraggableDimension, b: DraggableDimension): number => {
          console.log(
            'a index',
            a.descriptor.index,
            'b index',
            b.descriptor.index,
          );
          return a.descriptor.index - b.descriptor.index;
        },
      );
    console.log(
      'GET-DRAGGABLES-INSIDE-DROPPABLE',
      result.map(d => d.descriptor.id),
    );

    return result;
  },
);
