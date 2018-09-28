// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DraggableDimensionMap,
  DragMovement,
  DroppableDimension,
} from '../../../../../types';
import { goBefore, goAfter, goIntoStart } from '../../../../move-relative-to';
import getDraggablesInsideDroppable from '../../../../get-draggables-inside-droppable';
import isHomeOf from '../../../../droppable/is-home-of';

type NewHomeArgs = {|
  movement: DragMovement,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  movement,
  draggable,
  draggables,
  droppable,
}: NewHomeArgs): Position => {
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  const draggableClient: BoxModel = draggable.client;
  const axis: Axis = droppable.axis;

  // this will only happen in a foreign list
  if (!insideDestination.length) {
    return goIntoStart({
      axis,
      moveInto: droppable.client,
      isMoving: draggableClient,
    });
  }

  const { displaced, willDisplaceForward, displacedBy } = movement;

  const isOverHome: boolean = isHomeOf(draggable, droppable);

  // there can be no displaced if:
  // - you are in the home index or
  // - in the last position of a foreign droppable
  const closestDisplaced: ?DraggableDimension = displaced.length
    ? draggables[displaced[0].draggableId]
    : null;

  // dropping back into home index
  if (isOverHome && !closestDisplaced) {
    return draggable.client.borderBox.center;
  }

  // this can happen when moving into the last spot of a foreign list
  if (!closestDisplaced) {
    const moveRelativeTo: DraggableDimension =
      insideDestination[insideDestination.length - 1];
    return goAfter({
      axis,
      moveRelativeTo: moveRelativeTo.client,
      isMoving: draggableClient,
    });
  }

  const displacedClient: BoxModel = offset(
    closestDisplaced.client,
    displacedBy.point,
  );

  // go before and item that is displaced forward
  if (willDisplaceForward) {
    return goBefore({
      axis,
      moveRelativeTo: displacedClient,
      isMoving: draggableClient,
    });
  }

  // go after an item that is displaced backwards
  return goAfter({
    axis,
    moveRelativeTo: displacedClient,
    isMoving: draggableClient,
  });
};
