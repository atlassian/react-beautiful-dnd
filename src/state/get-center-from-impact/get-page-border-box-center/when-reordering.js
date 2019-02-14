// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DraggableDimensionMap,
  DragMovement,
  DroppableDimension,
  OnLift,
} from '../../../types';
import { goBefore, goAfter, goIntoStart } from '../move-relative-to';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import { negate } from '../../position';
import didStartDisplaced from '../../starting-displaced/did-start-displaced';

type NewHomeArgs = {|
  movement: DragMovement,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
  onLift: OnLift,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  movement,
  draggable,
  draggables,
  droppable,
  onLift,
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

  // go before the first displaced item
  // items can only be displaced forwards
  if (displaced.length) {
    const closestAfter: DraggableDimension =
      draggables[displaced[0].draggableId];
    // want to go before where it would be with the displacement

    // target is displaced and is already in it's starting position
    if (didStartDisplaced(closestAfter.descriptor.id, onLift)) {
      console.log('going before', closestAfter.descriptor.id);
      return goBefore({
        axis,
        moveRelativeTo: closestAfter.page,
        isMoving: draggablePage,
      });
    }

    // target has been displaced during the drag and it is not in its starting position
    // we need to account for the displacement
    const withDisplacement: BoxModel = offset(
      closestAfter.page,
      displacedBy.point,
    );

    return goBefore({
      axis,
      moveRelativeTo: withDisplacement,
      isMoving: draggablePage,
    });
  }

  // The closest before is not displaced. We want to go after it
  const closestBefore: DraggableDimension =
    insideDestination[insideDestination.length - 1];

  // we can just go into our original position
  if (closestBefore.descriptor.id === draggable.descriptor.id) {
    return draggablePage.borderBox.center;
  }

  // we need to go after the closest before

  if (didStartDisplaced(closestBefore.descriptor.id, onLift)) {
    // now the item is not displaced, it will not be sitting in it's original spot
    // we need to remove the displacement to get the target to its original spot
    const page: BoxModel = offset(
      closestBefore.page,
      negate(onLift.displacedBy.point),
    );
    return goAfter({
      axis,
      moveRelativeTo: page,
      isMoving: draggablePage,
    });
  }

  // item is in its resting spot. we can go straight after it
  return goAfter({
    axis,
    moveRelativeTo: closestBefore.page,
    isMoving: draggablePage,
  });
};
