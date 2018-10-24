// @flow
import getWillDisplaceForward from '../../../will-displace-forward';
import type {
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
  DragMovement,
} from '../../../../types';
import type { Instruction } from './move-to-next-index-types';

type Args = {|
  isInHomeList: boolean,
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  draggables: DraggableDimensionMap,
  merge: CombineImpact,
|};

export default ({
  isInHomeList,
  isMovingForward,
  draggable,
  destination,
  previousImpact,
  draggables,
  merge,
}: Args): ?Instruction => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  const movement: DragMovement = previousImpact.movement;
  const combineId: DraggableId = merge.combine.draggableId;
  const combine: DraggableDimension = draggables[combineId];
  const combineIndex: number = combine.descriptor.index;
  const isCombineDisplaced: boolean = Boolean(movement.map[combineId]);

  // moving from an item that is not displaced
  if (!isCombineDisplaced) {
    // Need to know if targeting the combined item would normally displace forward
    const willDisplaceForward: boolean = getWillDisplaceForward({
      isInHomeList,
      proposedIndex: combineIndex,
      startIndexInHome: draggable.descriptor.index,
    });

    if (willDisplaceForward) {
      // will displace forwards (eg home list moving backward from start)
      // moving forward will decrease displacement
      // moving backward will increase displacement

      if (isMovingForward) {
        // we skip displacement when we move past a displaced item
        return {
          proposedIndex: combineIndex + 1,
          modifyDisplacement: false,
        };
      }
      return {
        proposedIndex: combineIndex,
        modifyDisplacement: true,
      };
    }

    // will displace backwards (eg home list moving forward from start)
    // moving forward will increase displacement
    // moving backward will decrease displacement

    if (isMovingForward) {
      // we are moving into the visual spot of the combine item
      // and pushing it backwards
      return {
        proposedIndex: combineIndex,
        modifyDisplacement: true,
      };
    }
    // we are moving behind the displaced item and leaving it in place
    return {
      proposedIndex: combineIndex - 1,
      modifyDisplacement: false,
    };
  }

  // moving from an item that is already displaced
  const isDisplacedForward: boolean = movement.willDisplaceForward;
  const visualIndex: number = isDisplacedForward
    ? combineIndex + 1
    : combineIndex - 1;

  if (isDisplacedForward) {
    // if displaced forward, then moving forward will undo the displacement
    if (isMovingForward) {
      return {
        proposedIndex: visualIndex,
        modifyDisplacement: true,
      };
    }
    // if moving backwards, will move in front of the displaced item
    // want to leave the displaced item in place
    return {
      proposedIndex: visualIndex - 1,
      modifyDisplacement: false,
    };
  }

  // is displaced backwards
  // moving forward will increase the displacement
  // moving backward will decrease the displacement

  if (isMovingForward) {
    // we are moving forwards off the backwards displaced item, leaving it displaced
    return {
      proposedIndex: visualIndex + 1,
      modifyDisplacement: false,
    };
  }

  // we are moving backwards into the visual spot that the displaced item is occupying
  // this will undo the displacement of the item
  return {
    proposedIndex: visualIndex,
    modifyDisplacement: true,
  };
};
