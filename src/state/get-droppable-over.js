// @flow
import { isPointWithinDroppable } from './is-within-visible-bounds-of-droppable';
import { patch } from './position';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import type {
  DroppableId,
  Position,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DroppableDimension,
} from '../types';

const noPadding: Position = { x: 0, y: 0 };

type Args = {
  target: Position,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  previousDroppableOver: ?DroppableId,
};

export default ({
  target,
  draggable,
  draggables,
  droppables,
  previousDroppableOver,
}: Args): ?DroppableId => {
  const maybe: ?DroppableDimension =
    Object.keys(droppables)
      .map((id: DroppableId): DroppableDimension => droppables[id])
      .find((droppable: DroppableDimension): boolean => {
        const placeholderPadding = (() => {
          const isHomeDroppable = draggable.droppableId === droppable.id;
          const isCurrentlyHovered = previousDroppableOver &&
            previousDroppableOver === droppable.id;

          if (isHomeDroppable || !isCurrentlyHovered) {
            return noPadding;
          }

          const draggablesInDroppable = getDraggablesInsideDroppable(droppable, draggables);

          if (!draggablesInDroppable.length) {
            return noPadding;
          }

          const excessSpace = droppable.page.withMargin[droppable.axis.end] -
            draggablesInDroppable[draggablesInDroppable.length - 1]
              .page.withMargin[droppable.axis.end];
          const paddingSize = Math.max(
            draggable.page.withMargin[droppable.axis.size] - excessSpace,
            0
          );

          return patch(droppable.axis.line, paddingSize);
        })();

        return isPointWithinDroppable(droppable, placeholderPadding)(target);
      });

  return maybe ? maybe.id : null;
};
