// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableLocation,
} from '../../../../types';
import {
  forward,
  backward,
} from '../../../user-direction/user-direction-preset';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  destination,
  insideDestination: originalInsideDestination,
  previousImpact,
}: Args): ?DragImpact => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  // we move from a merge to a reorder, unless sort is disabled
  if (previousImpact.merge && !destination.isSortDisabled) {
    return null;
  }

  // we are on a location, and we are trying to combine onto a sibling
  // that sibling might be displaced

  const location: ?DraggableLocation = destination.isSortDisabled
    ? previousImpact.destination || previousImpact.merge
    : previousImpact.destination;
  invariant(location, 'Need a previous location to move from into a combine');

  const currentIndex: number = location.index;

  // update the insideDestination list to reflect the current
  // list order
  const currentInsideDestination: DraggableDimension[] = (() => {
    const shallow = originalInsideDestination.slice();

    // if we are in the home list we need to remove the item from its original position
    // before we insert it into its new position
    if (isInHomeList) {
      shallow.splice(draggable.descriptor.index, 1);
    }

    // put the draggable into its current position in the list
    shallow.splice(location.index, 0, draggable);
    return shallow;
  })();

  const targetIndex: number = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;

  if (targetIndex < 0) {
    return null;
  }

  // The last item that can be grouped with is the last one
  if (targetIndex > currentInsideDestination.length - 1) {
    return null;
  }

  const target: DraggableDimension = currentInsideDestination[targetIndex];

  const merge: CombineImpact = {
    whenEntered: isMovingForward ? forward : backward,
    index: targetIndex,
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };

  const impact: DragImpact = {
    // grouping does not modify the existing displacement
    movement: previousImpact.movement,
    // grouping removes the destination
    destination: null,
    direction: destination.axis.direction,
    merge,
  };

  return impact;
};
