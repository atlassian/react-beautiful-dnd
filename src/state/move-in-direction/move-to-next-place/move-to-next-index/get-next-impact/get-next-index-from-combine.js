// @flow
import getWillDisplaceForward from '../../../../will-displace-forward';
import type {
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
  DragMovement,
} from '../../../../../types';

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
}: Args): ?number => {
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
    console.warn('from NOT combined');
    console.log('combine index', combineIndex);
    // Need to know if targeting the combined item would normally displace forward
    const willDisplaceForward: boolean = getWillDisplaceForward({
      isInHomeList,
      proposedIndex: combineIndex,
      startIndexInHome: draggable.descriptor.index,
    });
    console.log('willDisplaceforward', willDisplaceForward);

    if (willDisplaceForward) {
      // will displace forwards (eg home list moving backward from start)
      // moving forward will decrease displacement
      // moving backward will increase displacement

      if (isMovingForward) {
        return combineIndex + 1;
      }
      return combineIndex;
    }

    // will displace backwards (eg home list moving forward from start)
    // moving forward will increase displacement
    // moving backward will decrease displacement
    if (isMovingForward) {
      return combineIndex;
    }
    return combineIndex - 1;
  }

  console.warn('from YES combined');

  // moving from an item that is already displaced
  const isDisplacedForward: boolean = movement.willDisplaceForward;
  const visualIndex: number = isDisplacedForward
    ? combineIndex + 1
    : combineIndex - 1;

  if (isDisplacedForward) {
    // if displaced forward, then moving forward will undo the displacement
    if (isMovingForward) {
      return visualIndex;
    }
    // if moving backwards, will move in front of the displaced item
    return visualIndex - 1;
  }

  // is displaced backwards

  // moving forward will increase the displacement
  if (isMovingForward) {
    return visualIndex + 1;
  }

  // moving backwards will undo the displacement
  return visualIndex;
};
