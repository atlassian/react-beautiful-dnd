// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DragImpact,
  DraggableId,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  LiftEffect,
} from '../../../types';
import { goBefore, goAfter, goIntoStart } from '../move-relative-to';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import { negate } from '../../position';
import didStartAfterCritical from '../../did-start-after-critical';

type NewHomeArgs = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppable: DroppableDimension,
  afterCritical: LiftEffect,
|};

// Returns the client offset required to move an item from its
// original client position to its final resting position
export default ({
  impact,
  draggable,
  draggables,
  droppable,
  afterCritical,
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

  const { displaced, displacedBy } = impact;
  const closestAfter: ?DraggableId = displaced.all[0];

  // go before the first displaced item
  // items can only be displaced forwards
  if (closestAfter) {
    const closest: DraggableDimension = draggables[closestAfter];
    // want to go before where it would be with the displacement

    // target is displaced and is already in it's starting position
    if (didStartAfterCritical(closestAfter, afterCritical)) {
      return goBefore({
        axis,
        moveRelativeTo: closest.page,
        isMoving: draggablePage,
      });
    }

    // target has been displaced during the drag and it is not in its starting position
    // we need to account for the displacement
    const withDisplacement: BoxModel = offset(closest.page, displacedBy.point);

    return goBefore({
      axis,
      moveRelativeTo: withDisplacement,
      isMoving: draggablePage,
    });
  }

  // Nothing in list is displaced, we should go after the last item

  const last: DraggableDimension =
    insideDestination[insideDestination.length - 1];

  // we can just go into our original position if the last item
  // is the dragging item
  if (last.descriptor.id === draggable.descriptor.id) {
    return draggablePage.borderBox.center;
  }

  if (didStartAfterCritical(last.descriptor.id, afterCritical)) {
    // if the item started displaced and it is no longer displaced then
    // we need to go after it it's non-displaced position

    const page: BoxModel = offset(
      last.page,
      negate(afterCritical.displacedBy.point),
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
    moveRelativeTo: last.page,
    isMoving: draggablePage,
  });
};
