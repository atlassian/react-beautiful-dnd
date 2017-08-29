// @flow
import type {
  DragMovement,
  Position,
  DimensionFragment,
  DraggableDimensionMap,
  DroppableDimension,
  DraggableId,
} from '../types';
import { add, patch, subtract } from './position';

type NewHomeArgs = {|
  movement: DragMovement,
  clientOffset: Position,
  pageOffset: Position,
  draggableId: DraggableId,
  droppableScrollDiff: Position,
  windowScrollDiff: Position,
  draggables: DraggableDimensionMap,
  destinationDroppable: ?DroppableDimension,
|}

type ClientOffset = Position;

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
}: NewHomeArgs): ClientOffset => {
  const { draggables: movedDraggables, isBeyondStartPosition } = movement;
  const draggedItem = draggables[draggableId];
  const isWithinHomeDroppable = destinationDroppable &&
    destinationDroppable.id === draggedItem.droppableId;

  // If there's no destination or if no movement has occurred, return the starting position.
  if (
    !destinationDroppable ||
    (isWithinHomeDroppable && !movedDraggables.length)
  ) {
    return add(droppableScrollDiff, windowScrollDiff);
  }

  const {
    axis,
    id: destinationDroppableId,
    page: destinationDroppablePage,
  } = destinationDroppable;

  // All the draggables in the destination (even the ones that haven't moved)
  const draggablesInDestination = Object.keys(draggables).filter(
    thisDraggableId => draggables[thisDraggableId].droppableId === destinationDroppableId
  );

  // The dimension of the item being dragged
  const draggedDimension: DimensionFragment = draggedItem.client.withMargin;

  // Find the dimension we need to compare the dragged item with
  const destinationDimension: DimensionFragment = (() => {
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
      return draggables[
        draggablesInDestination[draggablesInDestination.length - 1]
      ].client.withMargin;
    }

    // Otherwise, return the dimension of the empty droppable
    return destinationDroppablePage.withMargin;
  })();

  // The main axis edge to compare
  const mainAxisDistance: number = (() => {
    // If we're moving in after the last draggable in a new droppable
    // we match our start edge to its end edge
    if (
      !isWithinHomeDroppable &&
      !movedDraggables.length &&
      draggablesInDestination.length
    ) {
      return destinationDimension[axis.end] - draggedDimension[axis.start];
    }

    // If we're moving forwards in our own list we match end edges
    if (isBeyondStartPosition) {
      return destinationDimension[axis.end] - draggedDimension[axis.end];
    }

    // If we're moving backwards in our own list or into a new list
    // we match start edges
    return destinationDimension[axis.start] - draggedDimension[axis.start];
  })();

  // The difference along the cross axis
  const crossAxisDistance: number = destinationDimension[axis.crossAxisStart] -
    draggedDimension[axis.crossAxisStart];

  // Finally, this is how far the dragged item has to travel to be in its new home
  const amount: Position = patch(axis.line, mainAxisDistance, crossAxisDistance);

  // How far away it is on the page from where it needs to be
  const diff: Position = subtract(amount, pageOffset);

  // The final client offset
  const client: Position = add(diff, clientOffset);

  // Accounting for container scroll
  const withScroll: Position = add(client, droppableScrollDiff);

  return withScroll;
};
