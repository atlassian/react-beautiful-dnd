// @flow
import type {
  DragMovement,
  Position,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
} from '../types';
import { add, subtract } from './position';

type NewHomeArgs = {|
  movement: DragMovement,
  clientOffset: Position,
  pageOffset: Position,
  scrollDiff: Position,
  draggables: DraggableDimensionMap,
|}

type ClientOffset = Position;

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  movement,
  clientOffset,
  pageOffset,
  scrollDiff,
  draggables,
}: NewHomeArgs): ClientOffset => {
  // Just animate back to where it started
  if (!movement.draggables.length) {
    return scrollDiff;
  }

  // Currently not considering horizontal movement
  const distance: number = movement.draggables.reduce(
    (previous: number, draggableId: DraggableId): number => {
      const dimension: DraggableDimension = draggables[draggableId];
      return previous + dimension.page.withMargin.height;
    }, 0);

  const amount: number = movement.isMovingForward ? distance : -distance;

  // How much distance the item needs to travel to be in its new home
  // from where it started
  const verticalChange: Position = {
    x: 0,
    y: amount,
  };

  // How far away it is on the page from where it needs to be
  const verticalDiff: Position = subtract(verticalChange, pageOffset);

  // The final client offset
  const client: Position = add(verticalDiff, clientOffset);

  // Accounting for container scroll
  const withScroll: Position = add(client, scrollDiff);

  return withScroll;
};
