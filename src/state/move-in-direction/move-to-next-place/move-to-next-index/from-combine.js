// @flow
import type {
  DraggableId,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  CombineImpact,
  DraggableLocation,
  DragImpact,
} from '../../../../types';

type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  previousImpact: DragImpact,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  draggables: DraggableDimensionMap,
|};

export type Result = {|
  location: DraggableLocation,
  shouldDisplace: boolean,
|};

export default ({
  isMovingForward,
  isInHomeList,
  previousImpact,
  destination,
  insideDestination,
  draggables,
}: Args): ?Result => {
  const merge: ?CombineImpact = previousImpact.merge;
  // not moving from a merge
  if (!merge) {
    return null;
  }

  const targetId: DraggableId = merge.combine.draggableId;
  const target: DraggableDimension = draggables[targetId];
  const isTargetAlreadyDisplaced: boolean = Boolean(
    previousImpact.movement.map[targetId],
  );

  const targetIndex: number = target.descriptor.index;
  // const eventualIndex: number = isMovingForward ? targetIndex : targetIndex;
  console.log('is moving forward', isMovingForward);
  const eventualIndex: number = (() => {
    if (!isTargetAlreadyDisplaced) {
      console.log('returning target index', targetIndex);
      return isMovingForward ? targetIndex + 1 : targetIndex - 1;
    }
    const isDisplacedForward: boolean = !previousImpact.movement
      .isInFrontOfStart;

    console.log('is Displaced forward', isDisplacedForward);

    const base = isDisplacedForward ? targetIndex + 1 : targetIndex - 1;
    return base;
  })();

  const maxIndex: number = isInHomeList
    ? insideDestination.length - 1
    : // can go beyond the size of the list when in a foreign list
      insideDestination.length;

  if (targetIndex < 0) {
    return null;
  }

  if (targetIndex > maxIndex) {
    return null;
  }

  const letsDoThis: DraggableLocation = {
    droppableId: destination.descriptor.id,
    index: targetIndex,
  };

  console.log('pretend location', letsDoThis);

  return {};
};
