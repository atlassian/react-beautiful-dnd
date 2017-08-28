// @flow
import type {
  DragMovement,
  Position,
  DimensionFragment,
  DraggableDimensionMap,
  DraggableId,
  Axis,
} from '../types';
import { add, subtract, patch } from './position';

type NewHomeArgs = {|
  movement: DragMovement,
  clientOffset: Position,
  pageOffset: Position,
  draggableId: DraggableId,
  droppableScrollDiff: Position,
  windowScrollDiff: Position,
  draggables: DraggableDimensionMap,
  // axis of the destination droppable
  axis: ?Axis,
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
  draggables,
  axis,
}: NewHomeArgs): ClientOffset => {
  const { draggables: movedDraggables, isBeyondStartPosition } = movement;

  // Just animate back to where it started
  if (!movedDraggables.length) {
    return add(droppableScrollDiff, windowScrollDiff);
  }

  if (!axis) {
    console.error('should not have any movement if there is no axis');
    return add(droppableScrollDiff, windowScrollDiff);
  }

  // The dimension of the item being dragged
  const draggedDimension: DimensionFragment = draggables[draggableId].client.withMargin;
  // The index of the last item being displaced
  const displacedIndex: number = isBeyondStartPosition ? movedDraggables.length - 1 : 0;
  // The dimension of the last item being displaced
  const displacedDimension: DimensionFragment = draggables[
    movedDraggables[displacedIndex]
  ].client.withMargin;

  // Find the difference between the center of the dragging item
  // and the center of the last item being displaced
  const distanceToDisplacedCenter: Position = subtract(
    displacedDimension.center,
    draggedDimension.center
  );

  // To account for items of different sizes we need to adjust the offset
  // between their center points by half their size difference
  const mainAxisSizeDifference: number = (
    ((draggedDimension[axis.size] - displacedDimension[axis.size])
    / 2)
    * (isBeyondStartPosition ? -1 : 1)
  );
  const mainAxisSizeOffset: Position = patch(axis.line, mainAxisSizeDifference);

  // Finally, this is how far the dragged item has to travel to be in its new home
  const amount: Position = add(distanceToDisplacedCenter, mainAxisSizeOffset);

  // How far away it is on the page from where it needs to be
  const diff: Position = subtract(amount, pageOffset);

  // The final client offset
  const client: Position = add(diff, clientOffset);

  // Accounting for container scroll
  const withScroll: Position = add(client, droppableScrollDiff);

  return withScroll;
};
