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
import { goAfter, goBefore } from '../../../move-relative-to';
import getWillDisplaceForward from '../../../will-displace-forward';
import getDisplacedBy from '../../../get-displaced-by';
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
}: Args): ?MoveResult => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  const axis: Axis = destination.axis;
  const movement: DragMovement = previousImpact.movement;
  const combineId: DraggableId = merge.combine.draggableId;
  const combine: DraggableDimension = draggables[combineId];
  const combineIndex: number = combine.descriptor.index;

  const isCombineDisplaced: boolean = Boolean(movement.map[combineId]);

  const proposedIndex: number = (() => {
    if (isCombineDisplaced) {
      return combineIndex;
    }
    return isMovingForward ? combineIndex + 1 : combineIndex - 1;
  })();

  // pasted from from-reorder
  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex,
    startIndexInHome,
  });
  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    draggable.displaceBy,
    willDisplaceForward,
  );

  const atProposedIndex: DraggableDimension = insideDestination[proposedIndex];

  const isIncreasingDisplacement: boolean = (() => {
    if (isInHomeList) {
      // increase displacement if moving forward past start
      if (isMovingForward) {
        return proposedIndex > startIndexInHome;
      }
      // increase displacement if moving backwards away from start
      return proposedIndex < startIndexInHome;
    }

    // in foreign list moving forward will reduce the amount displaced
    return !isMovingForward;
  })();

  const lastDisplaced: Displacement[] = previousImpact.movement.displaced;
  const displaced: Displacement[] = isIncreasingDisplacement
    ? addClosest(atProposedIndex, lastDisplaced)
    : removeClosest(lastDisplaced);

  return {
    movement: {
      displacedBy,
      willDisplaceForward,
      displaced,
      map: getDisplacementMap(displaced),
    },
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
    merge: null,
  };
};
