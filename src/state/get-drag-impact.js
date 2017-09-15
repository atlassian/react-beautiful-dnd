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
  Axis,
  Position,
} from '../types';
import { add, subtract, patch } from './position';
import getDroppableOver from './get-droppable-over';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import noImpact, { noMovement } from './no-impact';

// Calculates the net scroll diff along the main axis
// between two droppables with internal scrolling
const getDroppablesScrollDiff = ({
  sourceDroppable,
  destinationDroppable,
  line,
}: {
  sourceDroppable: DroppableDimension,
  destinationDroppable: DroppableDimension,
  line: 'x' | 'y',
}): number => {
  const sourceScrollDiff = sourceDroppable.scroll.initial[line] -
    sourceDroppable.scroll.current[line];
  const destinationScrollDiff = destinationDroppable.scroll.initial[line] -
    destinationDroppable.scroll.current[line];
  return destinationScrollDiff - sourceScrollDiff;
};

// It is the responsibility of this function
// to return the impact of a drag

type Args = {|
  pageCenter: Position,
  draggable: DraggableDimension,
  homeDroppable: DroppableDimension,
  // all dimensions in system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap
|}

export default ({
  pageCenter,
  draggable,
  draggables,
  droppables,
}: Args): DragImpact => {
  const destinationId: ?DroppableId = getDroppableOver(
    pageCenter, droppables,
  );

  // not dragging over anything
  if (!destinationId) {
    return noImpact;
  }

  const destination: DroppableDimension = droppables[destinationId];
  const axis: Axis = destination.axis;

  if (!destination.isEnabled) {
    return noImpact;
  }

  const source: DroppableDimension = droppables[draggable.droppableId];
  const sourceScrollDiff: Position = subtract(source.scroll.current, source.scroll.initial);
  const originalCenter: Position = draggable.page.withoutMargin.center;
  // where the element actually is now
  const currentCenter: Position = add(pageCenter, sourceScrollDiff);
  const isWithinHomeDroppable = draggable.droppableId === destinationId;

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  // not considering margin so that items move based on visible edges
  const isBeyondStartPosition: boolean = currentCenter[axis.line] - originalCenter[axis.line] > 0;
  const shouldDisplaceItemsForward = isWithinHomeDroppable ? isBeyondStartPosition : false;

  const moved: DraggableId[] = insideDestination
    .filter((dimension: DraggableDimension): boolean => {
      // do not want to move the item that is dragging
      if (dimension === draggable) {
        return false;
      }

      const fragment: DimensionFragment = dimension.page.withoutMargin;

      // If we're over a new droppable items will be displaced
      // if they sit ahead of the dragging item
      if (!isWithinHomeDroppable) {
        const scrollDiff = getDroppablesScrollDiff({
          sourceDroppable: droppables[draggable.droppableId],
          destinationDroppable: destination,
          line: axis.line,
        });
        return (currentCenter[axis.line] - scrollDiff) < fragment[axis.end];
      }

      if (isBeyondStartPosition) {
        // 1. item needs to start ahead of the moving item
        // 2. the dragging item has moved over it
        if (fragment.center[axis.line] < originalCenter[axis.line]) {
          return false;
        }

        return currentCenter[axis.line] > fragment[axis.start];
      }
      // moving backwards
      // 1. item needs to start behind the moving item
      // 2. the dragging item has moved over it
      if (originalCenter[axis.line] < fragment.center[axis.line]) {
        return false;
      }

      return currentCenter[axis.line] < fragment[axis.end];
    })
    .map((dimension: DraggableDimension): DroppableId => dimension.id);

  // Need to ensure that we always order by the closest impacted item
  const ordered: DraggableId[] = (() => {
    if (!isWithinHomeDroppable) {
      return moved;
    }
    return isBeyondStartPosition ? moved.reverse() : moved;
  })();

  const index: number = (() => {
    // is over foreign list
    if (!isWithinHomeDroppable) {
      return insideDestination.length - moved.length;
    }

    // is over home list
    const startIndex = insideDestination.indexOf(draggable);
    if (!moved.length) {
      return startIndex;
    }

    if (isBeyondStartPosition) {
      return startIndex + moved.length;
    }
    // is moving backwards
    return startIndex - moved.length;
  })();

  const movement: DragMovement = {
    amount: patch(axis.line, draggable.page.withMargin[axis.size]),
    draggables: ordered,
    isBeyondStartPosition: shouldDisplaceItemsForward,
  };

  const impact: DragImpact = {
    movement,
    direction: axis.direction,
    destination: {
      droppableId: destinationId,
      index,
    },
  };

  return impact;
};
