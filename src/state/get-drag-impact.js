// @flow
import type { DraggableId,
  DroppableId,
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
  DimensionFragment,
  WithinDroppable,
  Axis,
  Position,
} from '../types';
import { patch } from './position';
import getDroppableOver from './get-droppable-over';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import noImpact from './no-impact';

// It is the responsibility of this function
// to return the impact of a drag

type ImpactArgs = {|
  // used to lookup which droppable you are over
  page: Position,
  // used for comparison with other dimensions
  withinDroppable: WithinDroppable,
  draggableId: DraggableId,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap
|}

export default ({
  page,
  withinDroppable,
  draggableId,
  draggables,
  droppables,
}: ImpactArgs): DragImpact => {
  const droppableId: ?DroppableId = getDroppableOver(
    page, droppables,
  );

  // not dragging over anything
  if (!droppableId) {
    return noImpact;
  }

  const newCenter = withinDroppable.center;
  const draggingDimension: DraggableDimension = draggables[draggableId];
  const droppableDimension: DroppableDimension = droppables[droppableId];

  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppableDimension,
    draggables,
  );

  const axis: Axis = droppableDimension.axis;

  // not considering margin so that items move based on visible edges
  const draggableCenter: Position = draggingDimension.page.withoutMargin.center;
  const isBeyondStartPosition: boolean = newCenter[axis.line] - draggableCenter[axis.line] > 0;
  const isWithinHomeDroppable = draggingDimension.droppableId === droppableId;
  const shouldDisplaceItemsForward = isWithinHomeDroppable ? isBeyondStartPosition : false;

  const moved: DraggableId[] = insideDroppable
    .filter((dimension: DraggableDimension): boolean => {
      // do not want to move the item that is dragging
      if (dimension === draggingDimension) {
        return false;
      }

      const fragment: DimensionFragment = dimension.page.withoutMargin;

      // If we're over a new droppable items will be displaced
      // if they sit ahead of the dragging item
      if (!isWithinHomeDroppable) {
        return newCenter[axis.line] < fragment[axis.end];
      }

      if (isBeyondStartPosition) {
        // 1. item needs to start ahead of the moving item
        // 2. the dragging item has moved over it
        if (fragment.center[axis.line] < draggableCenter[axis.line]) {
          return false;
        }

        return newCenter[axis.line] > fragment[axis.start];
      }
      // moving backwards
      // 1. item needs to start behind the moving item
      // 2. the dragging item has moved over it
      if (draggableCenter[axis.line] < fragment.center[axis.line]) {
        return false;
      }

      return newCenter[axis.line] < fragment[axis.end];
    })
    .map((dimension: DraggableDimension): DroppableId => dimension.id);

  const startIndex = insideDroppable.indexOf(draggingDimension);
  const index: number = (() => {
    if (!isWithinHomeDroppable) {
      return insideDroppable.length - moved.length;
    }

    if (!moved.length) {
      return startIndex;
    }

    if (isBeyondStartPosition) {
      return startIndex + moved.length;
    }
    // is moving backwards
    return startIndex - moved.length;
  })();

  const distance = index !== startIndex ?
    // need to ensure that the whole item is moved
    draggingDimension.page.withMargin[axis.size] :
    0;

  const amount: Position = patch(axis.line, distance);

  const movement: DragMovement = {
    amount,
    draggables: moved,
    isBeyondStartPosition: shouldDisplaceItemsForward,
  };

  const impact: DragImpact = {
    movement,
    direction: axis.direction,
    destination: {
      droppableId,
      index,
    },
  };

  return impact;
};
