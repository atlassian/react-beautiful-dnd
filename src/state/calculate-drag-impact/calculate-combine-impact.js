// @flow
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  UserDirection,
  CombineImpact,
} from '../../types';

type Args = {|
  combineWith: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  userDirection: UserDirection,
|};

function getWhenEntered(
  id: DraggableId,
  current: UserDirection,
  lastCombineImpact: ?CombineImpact,
): UserDirection {
  if (!lastCombineImpact) {
    return current;
  }
  if (id !== lastCombineImpact.combine.draggableId) {
    return current;
  }
  return lastCombineImpact.whenEntered;
}

function tryGetCombineImpact(impact: DragImpact): ?CombineImpact {
  if (impact.at && impact.at.type === 'COMBINE') {
    return impact.at;
  }
  return null;
}

export default function calculateCombineImpact({
  combineWith,
  userDirection,
  destination,
  previousImpact,
}: Args): DragImpact {
  const lastCombineImpact: ?CombineImpact = tryGetCombineImpact(previousImpact);
  const whenEntered: UserDirection = getWhenEntered(
    combineWith.descriptor.id,
    userDirection,
    lastCombineImpact,
  );
  const impact: DragImpact = {
    // no change to displacement when combining
    displacedBy: previousImpact.displacedBy,
    displaced: previousImpact.displaced,
    at: {
      type: 'COMBINE',
      whenEntered,
      combine: {
        draggableId: combineWith.descriptor.id,
        droppableId: destination.descriptor.id,
      },
    },
  };
  return impact;
}
