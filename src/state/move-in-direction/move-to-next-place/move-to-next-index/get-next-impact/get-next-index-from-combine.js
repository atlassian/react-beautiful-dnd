// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
  DragMovement,
} from '../../../../types';
import { goAfter, goBefore } from '../../../../move-relative-to';
import getWillDisplaceForward from '../../../../will-displace-forward';
import getDisplacedBy from '../../../../get-displaced-by';
import type { MoveResult } from '../move-to-next-place-types';

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
  const willDisplaceForward: boolean = movement.willDisplaceForward;

  const proposedIndex: number = (() => {
    console.log({
      isCombineDisplaced,
      willDisplaceForward,
      isMovingForward,
    });
    if (isCombineDisplaced) {
      if (willDisplaceForward) {
        if (isMovingForward) {
          return combineIndex + 1;
        }
        // moving backwards
        return combineIndex;
      }
      // will displace backwards
      if (isMovingForward) {
        return combineIndex + 1;
      }
      // moving backwards
      return combineIndex - 1;
    }

    // not displaced
    if (willDisplaceForward) {
      if (isMovingForward) {
        return combineIndex + 1;
      }
      // moving backwards
      return combineIndex;
    }

    // will displace backwards
    if (isMovingForward) {
      return combineIndex;
    }

    return combineIndex - 1;
  })();

  console.log('');
  return proposedIndex;
};
