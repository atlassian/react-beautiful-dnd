// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DraggableDimension,
  DraggableDimensionMap,
  DragMovement,
  DroppableDimension,
  DraggableIdMap,
} from '../../../types';
import { goBefore, goAfter, goIntoStart } from '../move-relative-to';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import { negate } from '../../position';

type NewHomeArgs = {|
  movement: DragMovement,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
  wasDisplacedOnLift: DraggableIdMap,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  movement,
  draggable,
  draggables,
  droppable,
  wasDisplacedOnLift,
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

    const didStartDisplaced: boolean = Boolean(
      wasDisplacedOnLift[closestAfter.descriptor.id],
    );

    // target already in resting spot
    if (didStartDisplaced) {
      return goBefore({
        axis,
        moveRelativeTo: closestAfter.page,
        isMoving: draggablePage,
      });
    }

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

  const didStartDisplaced: boolean = Boolean(
    wasDisplacedOnLift[closestBefore.descriptor.id],
  );

  if (didStartDisplaced) {
    // now the item is not displaced, it will not be sitting in it's original spot
    // we need to remove the displacement to get the target to its original spot
    const page: BoxModel = offset(
      closestBefore.page,
      negate(displacedBy.point),
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
