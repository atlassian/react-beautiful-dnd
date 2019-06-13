// @flow
import type {
  DroppableDimension,
  DragImpact,
  Combine,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
  LiftEffect,
} from '../../../../types';
import didStartDisplaced from '../../../starting-displaced/did-start-displaced';

type Args = {|
  isMovingForward: boolean,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  draggables: DraggableDimensionMap,
  combine: Combine,
  afterCritical: LiftEffect,
|};

export default ({
  isMovingForward,
  destination,
  // previousImpact,
  draggables,
  combine,
  afterCritical,
}: Args): ?number => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  // are we sitting on a displaced item?

  const combineId: DraggableId = combine.draggableId;
  const combineWith: DraggableDimension = draggables[combineId];
  const combineIndex: number = combineWith.descriptor.index;
  const wasDisplacedAtStart: boolean = didStartDisplaced(
    combineId,
    afterCritical,
  );

  // are we sitting on a displaced item?

  if (wasDisplacedAtStart) {
    const hasDisplacedFromStart: boolean = !movement.map[combineId];

    if (hasDisplacedFromStart) {
      if (isMovingForward) {
        return combineIndex;
      }

      return combineIndex - 1;
    }

    // move into position of combine
    if (isMovingForward) {
      return {
        proposedIndex: combineIndex,
        modifyDisplacement: true,
      };
    }

    return {
      proposedIndex: combineIndex - 1,
      modifyDisplacement: false,
    };
  }

  const isDisplaced: boolean = Boolean(movement.map[combineId]);

  if (isDisplaced) {
    if (isMovingForward) {
      return {
        proposedIndex: combineIndex + 1,
        modifyDisplacement: true,
      };
    }
    return {
      proposedIndex: combineIndex,
      modifyDisplacement: false,
    };
  }

  if (isMovingForward) {
    return {
      proposedIndex: combineIndex + 1,
      modifyDisplacement: false,
    };
  }

  return {
    proposedIndex: combineIndex,
    modifyDisplacement: true,
  };
};
