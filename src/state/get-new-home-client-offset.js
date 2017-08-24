// @flow
import type {
  DragMovement,
  Position,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
  Axis,
} from '../types';
import { add, subtract, patch } from './position';

type NewHomeArgs = {|
  movement: DragMovement,
  clientOffset: Position,
  pageOffset: Position,
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
  droppableScrollDiff,
  windowScrollDiff,
  draggables,
  axis,
}: NewHomeArgs): ClientOffset => {
  // Just animate back to where it started
  if (!movement.draggables.length) {
    return add(droppableScrollDiff, windowScrollDiff);
  }

  if (!axis) {
    console.error('should not have any movement if there is no axis');
    return add(droppableScrollDiff, windowScrollDiff);
  }

  // Currently not considering horizontal movement
  const distance: number = movement.draggables.reduce(
    (previous: number, draggableId: DraggableId): number => {
      const dimension: DraggableDimension = draggables[draggableId];
      // $ExpectError - for some reason flow is not liking axis.size
      return previous + dimension.page.withMargin[axis.size];
    }, 0);

  const signed: number = movement.isBeyondStartPosition ? distance : -distance;

  // How much distance the item needs to travel to be in its new home
  // from where it started
  const amount = patch(axis.line, signed);

  // How far away it is on the page from where it needs to be
  const diff: Position = subtract(amount, pageOffset);

  // The final client offset
  const client: Position = add(diff, clientOffset);

  // Accounting for container scroll
  const withScroll: Position = add(client, droppableScrollDiff);

  return withScroll;
};
