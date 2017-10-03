// @flow
import { isPointWithinDroppable } from './is-within-visible-bounds-of-droppable';
import { patch } from './position';
import type {
  DroppableId,
  Position,
  DraggableDimension,
  DroppableDimensionMap,
  DroppableDimension,
} from '../types';

type Args = {
  target: Position,
  draggable: DraggableDimension,
  droppables: DroppableDimensionMap,
  previousDroppableOver: ?DroppableId,
};

export default ({
  target,
  draggable,
  droppables,
  previousDroppableOver,
}: Args): ?DroppableId => {
  const maybe: ?DroppableDimension =
    Object.keys(droppables)
      .map((id: DroppableId): DroppableDimension => droppables[id])
      .find((droppable: DroppableDimension): boolean => {
        const isHomeDroppable = draggable.droppableId === droppable.id;
        const isCurrentlyHovered = previousDroppableOver && previousDroppableOver === droppable.id;
        const placeholderPadding = !isHomeDroppable && isCurrentlyHovered
          ? patch(droppable.axis.line, draggable.page.withMargin[droppable.axis.size])
          : { x: 0, y: 0 };
        return isPointWithinDroppable(droppable, placeholderPadding)(target);
      });

  return maybe ? maybe.id : null;
};
