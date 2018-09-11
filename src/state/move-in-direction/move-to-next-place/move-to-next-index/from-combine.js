// @flow
import type {
  DroppableDimension,
  DragImpact,
  DragMovement,
  CombineImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
} from '../../../../types';
import type { MoveFromResult } from './move-to-next-index-types';

type Args = {|
  isInHomeList: boolean,
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  draggables: DraggableDimensionMap,
|};

export default ({
  isInHomeList,
  isMovingForward,
  draggable,
  destination,
  previousImpact,
  draggables,
}: Args): ?MoveFromResult => {
  if (!destination.isCombineEnabled) {
    return null;
  }
  const merge: ?CombineImpact = previousImpact.merge;

  // only handling cases which had a merge
  if (!merge) {
    return null;
  }

  const combineWithId: DraggableId = merge.combine.draggableId;
  const combineWith: DraggableDimension = draggables[combineWithId];
  const combineWithStartIndex: number = combineWith.descriptor.index;
  const movement: DragMovement = previousImpact.movement;
  const isTargetDisplaced: boolean = Boolean(movement.map[combineWithId]);
  const isDisplacedForward: boolean =
    isTargetDisplaced && movement.willDisplaceForward;

  const combineWithVisualIndex: number = (() => {
    if (!isTargetDisplaced) {
      return combineWithStartIndex;
    }
    return isDisplacedForward
      ? combineWithStartIndex + 1
      : combineWithStartIndex - 1;
  })();

  // const { proposedIndex, addToDisplacement } = (() => {

  // })();

  // const proposedIndex: number = (() => {
  //   // the movement will undo the displacement?
  //   if (isTargetDisplaced) {
  //     if (isDisplacedForward) {
  //       return isMovingForward ? targetVisualIndex : targetVisualIndex - 1;
  //     }
  //     // moving displaced backwards
  //     return isMovingForward ? targetVisualIndex + 1 : targetVisualIndex;
  //   }

  //   // the movement
  // })();

  // const temp: boolean = getWillDisplaceForward({
  //   isInHomeList,
  //   proposedIndex: targetVisualIndex,
  //   startIndexInHome: draggable.descriptor.index,
  // });

  // const proposedIndex: number = (() => {})();

  // const willDisplaceForward: boolean = getWillDisplaceForward({
  //   isInHomeList,
  //   proposedIndex,
  //   startIndexInHome,
  // });
  console.log('visual index', combineWithVisualIndex);
};
