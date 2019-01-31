// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DraggableDimensionMap,
  DragMovement,
  DroppableDimension,
  DisplacementMap,
} from '../../../types';
import { goBefore, goAfter, goIntoStart } from '../move-relative-to';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';

type NewHomeArgs = {|
  movement: DragMovement,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
  startingDisplacementMap: DisplacementMap,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  movement,
  draggable,
  draggables,
  droppable,
  startingDisplacementMap,
}: NewHomeArgs): Position => {
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable.descriptor.id,
    draggables,
  );

  const draggablePage: BoxModel = draggable.page;
  const axis: Axis = droppable.axis;

  // this will only happen in a foreign list
  if (!insideDestination.length) {
    return goIntoStart({
      axis,
      moveInto: droppable.page,
      isMoving: draggablePage,
    });
  }

  const { displaced, displacedBy } = movement;

  // there can be no displaced if:
  // - in the last position of a droppable
  const closest: ?DraggableDimension = displaced.length
    ? draggables[displaced[0].draggableId]
    : null;

  if (!closest) {
    // this can happen when moving into the last spot of a list
    const moveRelativeTo: DraggableDimension =
      insideDestination[insideDestination.length - 1];
    console.log('moveRelativeTo', moveRelativeTo.descriptor.id);
    return goAfter({
      axis,
      moveRelativeTo: moveRelativeTo.page,
      isMoving: draggablePage,
    });
  }

  const displacedClosest: BoxModel = offset(closest.page, displacedBy.point);

  // go before and item that is displaced forward
  // if (willDisplaceForward) {
  console.log('droppable before', closest.descriptor.id);
  return goBefore({
    axis,
    moveRelativeTo: displacedClosest,
    isMoving: draggablePage,
  });
  // }

  // go after an item that is displaced backwards
  // return goAfter({
  //   axis,
  //   moveRelativeTo: displacedClosest,
  //   isMoving: draggablePage,
  // });
};
