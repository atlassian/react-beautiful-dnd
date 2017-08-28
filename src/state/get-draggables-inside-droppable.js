// @flow
import memoizeOne from 'memoize-one';
import { draggableMapToList } from './dimension-map-to-list';
import type {
  Position,
  DraggableId,
  DimensionFragment,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../types';

const isOverDroppable = (target: Position, droppable: DroppableDimension): boolean => {
  const fragment: DimensionFragment = droppable.page.withMargin;
  const { top, right, bottom, left } = fragment;

  return target.x >= left &&
    target.x <= right &&
    target.y >= top &&
    target.y <= bottom;
};

type Dragging = {|
  draggableId: DraggableId,
  center: Position,
|}

export default (droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  dragging?: Dragging,
): DraggableDimension[] => draggableMapToList(draggables)
  .filter((draggable: DraggableDimension): boolean => {
    if (dragging && dragging.draggableId === draggable.id) {
      return isOverDroppable(dragging.center, droppable);
    }

    return droppable.id === draggable.droppableId;
  })
  // Dimensions are not guarenteed to be ordered in the same order as keys
  // So we need to sort them so they are in the correct order
  .sort((a: DraggableDimension, b: DraggableDimension): number => (
    a.page.withoutMargin.center[droppable.axis.line] -
    b.page.withoutMargin.center[droppable.axis.line]
  ));
