// @flow
import type {
  DraggableId,
  DroppableId,
  DragImpact,
  UserDirection,
  CombineImpact,
} from '../../types';

type Args = {|
  combineWithId: DraggableId,
  destinationId: DroppableId,
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
  combineWithId,
  destinationId,
  userDirection,
  previousImpact,
}: Args): DragImpact {
  const lastCombineImpact: ?CombineImpact = tryGetCombineImpact(previousImpact);
  const whenEntered: UserDirection = getWhenEntered(
    combineWithId,
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
        draggableId: combineWithId,
        droppableId: destinationId,
      },
    },
  };
  return impact;
}
