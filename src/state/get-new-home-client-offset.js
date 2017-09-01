// @flow
import type {
  DimensionFragment,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
  DragMovement,
  DroppableDimension,
  Position,
} from '../types';
import { add, subtract } from './position';
import moveToEdge from './move-to-edge';
import { draggableMapToList } from './dimension-map-to-list';

type NewHomeArgs = {|
  movement: DragMovement,
  clientOffset: Position,
  pageOffset: Position,
  draggableId: DraggableId,
  droppableScrollDiff: Position,
  windowScrollDiff: Position,
  draggables: DraggableDimensionMap,
  destinationDroppable: ?DroppableDimension,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  movement,
  clientOffset,
  pageOffset,
  draggableId,
  droppableScrollDiff,
  windowScrollDiff,
  destinationDroppable,
  draggables,
}: NewHomeArgs): Position => {
  const { draggables: movedDraggables, isBeyondStartPosition } = movement;
  const draggedItem: DraggableDimension = draggables[draggableId];
  const isWithinHomeDroppable: boolean = Boolean(
    destinationDroppable &&
    destinationDroppable.id === draggedItem.droppableId
  );

  // If there's no destination or if no movement has occurred, return the starting position.
  if (!destinationDroppable ||
    (isWithinHomeDroppable && !movedDraggables.length)) {
    return add(droppableScrollDiff, windowScrollDiff);
  }

  const {
    axis,
    id: destinationDroppableId,
    client: destinationDroppableClient,
  } = destinationDroppable;

  // All the draggables in the destination (even the ones that haven't moved)
  const draggablesInDestination: DraggableDimension[] = draggableMapToList(draggables).filter(
    draggable => draggable.droppableId === destinationDroppableId
  );

  // The dimension of the item being dragged
  const draggedDimensionFragment: DimensionFragment = draggedItem.client.withMargin;

  // Find the dimension we need to compare the dragged item with
  const destinationDimensionFragment: DimensionFragment = (() => {
    // If we're not dragging into an empty list
    if (movedDraggables.length) {
      // The index of the last item being displaced
      const displacedIndex: number = isBeyondStartPosition ? movedDraggables.length - 1 : 0;
      // Return the dimension of the last item being displaced
      return draggables[
        movedDraggables[displacedIndex]
      ].client.withMargin;
    }

    // If we're dragging to the last place in a new droppable
    // which has items in it (but which haven't moved)
    if (draggablesInDestination.length) {
      return draggablesInDestination[
        draggablesInDestination.length - 1
      ].client.withMargin;
    }

    // Otherwise, return the dimension of the empty droppable
    return destinationDroppableClient.withMargin;
  })();

  const { sourceEdge, destinationEdge } = (() => {
    // If we're moving in after the last draggable in a new droppable
    // we match our start edge to its end edge
    if (!isWithinHomeDroppable &&
      !movedDraggables.length &&
      draggablesInDestination.length) {
      return { sourceEdge: 'start', destinationEdge: 'end' };
    }

    // If we're moving forwards in our own list we match end edges
    if (isBeyondStartPosition) {
      return { sourceEdge: 'end', destinationEdge: 'end' };
    }

    // If we're moving backwards in our own list or into a new list
    // we match start edges
    return { sourceEdge: 'start', destinationEdge: 'start' };
  })();

  // This is the draggable's new home
  const destination: Position = moveToEdge({
    source: draggedDimensionFragment,
    sourceEdge,
    destination: destinationDimensionFragment,
    destinationEdge,
    destinationAxis: axis,
  });

  // The difference between its old position and new position
  const distance: Position = subtract(destination, draggedDimensionFragment.center);

  // Accounting for page, client and scroll container offsets
  const netPageClientOffset: Position = subtract(clientOffset, pageOffset);
  const offsets: Position = add(droppableScrollDiff, netPageClientOffset);

  // Finally, this is how far the dragged item has to travel to be in its new home
  const withOffsets: Position = add(distance, offsets);

  return withOffsets;
};
