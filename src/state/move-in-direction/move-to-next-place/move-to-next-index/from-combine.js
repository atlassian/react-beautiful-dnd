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

type Args = {|
  isInHomeList: boolean,
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  draggables: DraggableDimensionMap,
  merge: CombineImpact,
  onLift: OnLift,
|};

export default ({
  isInHomeList,
  isMovingForward,
  draggable,
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
  const isCombineDisplaced: boolean = Boolean(movement.map[combineId]);
  const wasDisplacedAtStart: boolean = Boolean(onLift.wasDisplaced[combineId]);
  const hasDisplacedFromStart: boolean =
    (isCombineDisplaced && !wasDisplacedAtStart) ||
    (!isCombineDisplaced && wasDisplacedAtStart);
  console.group('from combine.js');
  // console.log('isCombineDisplaced', isCombineDisplaced);
  // console.log('wasDisplacedAtStart', wasDisplacedAtStart);
  // console.warn('hasDisplacedFromStart', hasDisplacedFromStart);

  const visualIndex: number = combineIndex + 1;

  // moving away from target that has been displaced after the start of a drag
  if (hasDisplacedFromStart) {
    if (isMovingForward) {
      console.log('🛑: moving forward from displaced');
      console.groupEnd();
      return {
        proposedIndex: combineIndex + 1,
        modifyDisplacement: true,
      };
    }
    // if moving backwards, will move in front of the displaced item
    // want to leave the displaced item in place
    console.log('✅: move backwards from displaced');
    console.groupEnd();
    return {
      proposedIndex: combineIndex - 1,
      modifyDisplacement: true,
    };
  }

  // moving off target that has not been displaced after the start of a drag

  if (isMovingForward) {
    // this will increase the amount of displacement
    // this will displace the item backwards
    // we are moving into the items position
    console.log('✅ move forwards from non-displaced');
    console.groupEnd();
    return {
      proposedIndex: combineIndex,
      modifyDisplacement: true,
    };
  }
  // this will in
  console.log('✅: move backwards from non-displaced');
  console.groupEnd();
  return {
    proposedIndex: combineIndex - 1,
    modifyDisplacement: true,
  };
};
