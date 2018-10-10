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
  const visualIndex: number = (() => {
    if (!isCombineDisplaced) {
      return combineIndex;
    }
    return willDisplaceForward ? combineIndex + 1 : combineIndex - 1;
  })();

  console.log('visual index', visualIndex);
  console.log({
    isCombineDisplaced,
    willDisplaceForward,
    isMovingForward,
    combineIndex,
    visualIndex,
  });

  // moving from an item that is not displaced
  if (!isCombineDisplaced) {
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
  return null;

  // const willDisplaceForward: boolean = movement.willDisplaceForward;

  // const proposedIndex: number = (() => {
  //   console.log({
  //     isCombineDisplaced,
  //     willDisplaceForward,
  //     isMovingForward,
  //   });
  //   // will we be moving into the spot of the displaced item,
  //   // or moving onto the next ...?

  //   if (isCombineDisplaced) {
  //     if (willDisplaceForward) {
  //       if (isMovingForward) {
  //         return combineIndex + 1;
  //       }
  //       // moving backwards
  //       return combineIndex;
  //     }
  //     // will displace backwards
  //     if (isMovingForward) {
  //       return combineIndex + 1;
  //     }
  //     // moving backwards
  //     return combineIndex - 1;
  //   }

  //   // will we be moving into the spot of the combined item,
  //   // or pushing it out of the way?

  //   // not displaced
  //   if (willDisplaceForward) {
  //     if (isMovingForward) {
  //       return combineIndex + 1;
  //     }
  //     // moving backwards
  //     return combineIndex;
  //   }

  //   // will displace backwards
  //   if (isMovingForward) {
  //     return combineIndex;
  //   }

  //   return combineIndex - 1;
  // })();

  // return proposedIndex;
};
