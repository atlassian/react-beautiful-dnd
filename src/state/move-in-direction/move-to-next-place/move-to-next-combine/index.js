// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableLocation,
  DraggableId,
} from '../../../../types';
import {
  forward,
  backward,
} from '../../../user-direction/user-direction-preset';
import { tryGetDestination } from '../../../get-impact-location';
import { findIndex } from '../../../../native-with-fallback';
import removeDraggableFromList from '../../../remove-draggable-from-list';

export type Args = {|
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  draggable,
  destination,
  insideDestination,
  previousImpact,
}: Args): ?DragImpact => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  const location: ?DraggableLocation = tryGetDestination(previousImpact);

  if (!location) {
    return null;
  }

  function getImpact(target: DraggableId) {
    const at: CombineImpact = {
      type: 'COMBINE',
      whenEntered: isMovingForward ? forward : backward,
      combine: {
        draggableId: target,
        droppableId: destination.descriptor.id,
      },
    };
    return {
      ...previousImpact,
      at,
    };
  }

  const all: DraggableId[] = previousImpact.displaced.all;
  const closestId: ?DraggableId = all.length ? all[0] : null;

  if (isMovingForward) {
    return closestId ? getImpact(closestId) : null;
  }

  const withoutDraggable = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  // Moving backwards

  // if nothing is displaced - move backwards onto the last item
  if (!closestId) {
    if (!withoutDraggable.length) {
      return null;
    }
    const last: DraggableDimension =
      withoutDraggable[withoutDraggable.length - 1];
    return getImpact(last.descriptor.id);
  }

  // need to find the first item before the closest
  const indexOfClosest: number = findIndex(
    withoutDraggable,
    d => d.descriptor.id === closestId,
  );
  invariant(indexOfClosest !== -1, 'Could not find displaced item in set');

  const proposedIndex: number = indexOfClosest - 1;

  // cannot move before start of set
  if (proposedIndex < 0) {
    return null;
  }

  const before: DraggableDimension = withoutDraggable[proposedIndex];
  return getImpact(before.descriptor.id);
};
