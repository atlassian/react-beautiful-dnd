// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
  DragImpact,
  DragMovement,
  CombineImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DraggableId,
} from '../../../../../types';
import { goAfter, goBefore } from '../../../../move-relative-to';
import { patch } from '../../../../position';
import type { MoveFromResult } from '../move-to-next-index-types';

type Args = {|
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  movement: DragMovement,
  merge: CombineImpact,
  draggables: DraggableDimensionMap,
|};

export default ({
  isMovingForward,
  draggable,
  destination,
  movement,
  merge,
  draggables,
}: Args): ?MoveFromResult => {
  const axis: Axis = destination.axis;
  const combineId: DraggableId = merge.combine.draggableId;
  const combine: DraggableDimension = draggables[combineId];
  const willDisplaceForward: boolean = movement.willDisplaceForward;
  const isCombineDisplaced: boolean = Boolean(movement.map[combineId]);

  const displaceBy: Position = patch(
    axis.line,
    draggable.displaceBy[axis.line],
  );
  const unshifted: BoxModel = combine.page;
  const displaced: BoxModel = offset(unshifted, displaceBy);

  if (isCombineDisplaced) {
    // will eat up displacement
    if (isMovingForward) {
      const newPageBorderBoxCenter: Position = goAfter({
        axis,
        moveRelativeTo: unshifted,
        isMoving: draggable.page,
      });
      return {
        newPageBorderBoxCenter,
        changeDisplacement: {
          type: 'REMOVE_CLOSEST',
        },
        willDisplaceForward,
        proposedIndex: combine.descriptor.index + 1,
      };
    }
    // moving backward off displacement
    const newPageBorderBoxCenter: Position = goBefore({
      axis,
      moveRelativeTo: displaced,
      isMoving: draggable.page,
    });
    return {
      newPageBorderBoxCenter,
      changeDisplacement: {
        type: 'DO_NOTHING',
      },
      willDisplaceForward,
      proposedIndex: combine.descriptor.index,
    };
  }

  // is combined with something that is not already displaced
  if (isMovingForward) {
    const newPageBorderBoxCenter: Position = goAfter({
      axis,
      moveRelativeTo: unshifted,
      isMoving: draggable.page,
    });
    return {
      newPageBorderBoxCenter,
      changeDisplacement: {
        type: 'DO_NOTHING',
      },
      willDisplaceForward,
      proposedIndex: combine.descriptor.index + 1,
    };
  }

  // movement will increase displacement
  const newPageBorderBoxCenter: Position = goBefore({
    axis,
    moveRelativeTo: displaced,
    isMoving: draggable.page,
  });
  return {
    newPageBorderBoxCenter,
    changeDisplacement: {
      type: 'ADD_CLOSEST',
      add: combine,
    },
    willDisplaceForward,
    proposedIndex: combine.descriptor.index,
  };
};
