// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DraggableDimensionMap,
  DragImpact,
  DraggableLocation,
  DroppableDimension,
} from '../../types';
import { goBefore, goAfter, goIntoStart } from '../move-relative-to';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import isHomeOf from '../droppable/is-home-of';

type NewHomeArgs = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  // all draggables in the system
  draggables: DraggableDimensionMap,
  destination: ?DroppableDimension,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  impact,
  draggable,
  draggables,
  destination,
}: NewHomeArgs): ?Position => {
  // not dropping anywhere
  if (destination == null) {
    return null;
  }
  // dropping outside of any list
  const location: ?DraggableLocation = impact.destination;
  if (!location) {
    return null;
  }

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  const draggableClient: BoxModel = draggable.client;
  const axis: Axis = destination.axis;

  // this will only happen in a foreign list
  if (!insideDestination.length) {
    return goIntoStart({
      axis,
      moveInto: destination.client,
      isMoving: draggableClient,
    });
  }

  const { displaced, willDisplaceForward } = impact.movement;

  const isOverHome: boolean = isHomeOf(draggable, destination);

  // there can be no displaced if:
  // - you are in the home index or
  // - in the last position of a foreign droppable
  const lastDisplaced: ?DraggableDimension = displaced.length
    ? draggables[displaced[0].draggableId]
    : null;

  // dropping back into home index
  if (isOverHome && !lastDisplaced) {
    return null;
  }

  // this can happen when moving into the last spot of a foreign list
  if (!lastDisplaced) {
    const moveRelativeTo: DraggableDimension =
      insideDestination[insideDestination.length - 1];
    return goAfter({
      axis,
      moveRelativeTo: moveRelativeTo.client,
      isMoving: draggableClient,
    });
  }

  const displacedBy: Position = impact.movement.displacedBy.point;
  const displacedClient: BoxModel = offset(lastDisplaced.client, displacedBy);
  const shouldDropInFrontOfDisplaced: boolean = !willDisplaceForward;

  // going in front of displaced item
  if (shouldDropInFrontOfDisplaced) {
    return goAfter({
      axis,
      moveRelativeTo: displacedClient,
      isMoving: draggableClient,
    });
  }

  // going behind displaced item
  return goBefore({
    axis,
    moveRelativeTo: displacedClient,
    isMoving: draggableClient,
  });
};
