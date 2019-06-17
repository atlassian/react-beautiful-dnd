// @flow
import type {
  DroppableDimension,
  Combine,
  DraggableDimension,
  DraggableDimensionMap,
  DisplacementGroups,
  DraggableId,
  LiftEffect,
} from '../../../../types';
import didStartAfterCritical from '../../../did-start-after-critical';

type Args = {|
  isMovingForward: boolean,
  destination: DroppableDimension,
  displaced: DisplacementGroups,
  draggables: DraggableDimensionMap,
  combine: Combine,
  afterCritical: LiftEffect,
|};

export default ({
  isMovingForward,
  destination,
  draggables,
  combine,
  afterCritical,
}: Args): ?number => {
  if (!destination.isCombineEnabled) {
    return null;
  }
  const combineId: DraggableId = combine.draggableId;
  const combineWith: DraggableDimension = draggables[combineId];
  const combineWithIndex: number = combineWith.descriptor.index;
  const didCombineWithStartAfterCritical: boolean = didStartAfterCritical(
    combineId,
    afterCritical,
  );

  if (didCombineWithStartAfterCritical) {
    if (isMovingForward) {
      return combineWithIndex;
    }
    return combineWithIndex - 1;
  }

  if (isMovingForward) {
    return combineWithIndex + 1;
  }

  return combineWithIndex;
};
