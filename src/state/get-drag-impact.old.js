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
import noImpact from './no-impact';

// Calculates the net scroll diff along the main axis
// between two droppables with internal scrolling
type GetDroppableScrollDiff = {|
  home: DroppableDimension,
  foreign: DroppableDimension,
  axis: Axis
|}

const getDroppablesScrollDiff = ({
  home,
  foreign,
  axis,
}): number => {
  const homeScrollDiff: number =
    home.scroll.initial[axis.line] -
    home.scroll.current[axis.line];

  const foreignScrollDiff =
    foreign.scroll.initial[axis.line] -
    foreign.scroll.current[axis.line];

  return foreignScrollDiff - homeScrollDiff;
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

  const home: DroppableDimension = droppables[draggable.droppableId];
  const homeScrollDiff: Position = subtract(home.scroll.current, home.scroll.initial);
  const originalCenter: Position = draggable.page.withoutMargin.center;
  // Where the element actually is now
  const currentCenter: Position = add(pageCenter, homeScrollDiff);
  const isWithinHomeDroppable = draggable.droppableId === destinationId;

  const foreignScrollDiff: Position = isWithinHomeDroppable ?
    subtract(home.scroll.current, home.scroll.initial) :
    origin;

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  // not considering margin so that items move based on visible edges
  const isBeyondStartPosition: boolean = currentCenter[axis.line] - originalCenter[axis.line] > 0;
  const shouldDisplaceItemsForward = isWithinHomeDroppable ? isBeyondStartPosition : false;

  const moved: DraggableId[] = insideDestination
    .filter((child: DraggableDimension): boolean => {
      // do not want to move the item that is dragging
      if (child === draggable) {
        return false;
      }

      const fragment: DimensionFragment = child.page.withoutMargin;

      // If we're over a new droppable items will be displaced
      // if they sit ahead of the dragging item
      if (!isWithinHomeDroppable) {
        const scrollDiff = getDroppablesScrollDiff({
          home: droppables[draggable.droppableId],
          foreign: destination,
          axis,
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
