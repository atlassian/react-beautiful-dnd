// @flow
import type {
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
  DragMovement,
  OnLift,
} from '../../../../types';
import type { Instruction } from './move-to-next-index-types';
import didStartDisplaced from '../../../starting-displaced/did-start-displaced';

type Args = {|
  isMovingForward: boolean,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  draggables: DraggableDimensionMap,
  merge: CombineImpact,
  onLift: OnLift,
|};

export default ({
  isMovingForward,
  destination,
  previousImpact,
  draggables,
  merge,
  onLift,
}: Args): ?Instruction => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  const movement: DragMovement = previousImpact.movement;
  const combineId: DraggableId = merge.combine.draggableId;
  const combine: DraggableDimension = draggables[combineId];
  const combineIndex: number = combine.descriptor.index;
  const wasDisplacedAtStart: boolean = didStartDisplaced(combineId, onLift);

  if (wasDisplacedAtStart) {
    const hasDisplacedFromStart: boolean = !movement.map[combineId];

    if (hasDisplacedFromStart) {
      if (isMovingForward) {
        return {
          proposedIndex: combineIndex,
          modifyDisplacement: false,
        };
      }

      return {
        proposedIndex: combineIndex - 1,
        modifyDisplacement: true,
      };
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
