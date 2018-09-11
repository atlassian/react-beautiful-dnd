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

  const axis: Axis = destination.axis;
  const movement: DragMovement = previousImpact.movement;
  const combineId: DraggableId = merge.combine.draggableId;
  const combine: DraggableDimension = draggables[combineId];
  const combineIndex: number = combine.descriptor.index;

  const isCombineDisplaced: boolean = Boolean(movement.map[combineId]);

  const unshifted: BoxModel = combine.page;
  console.log('is combine displaced?', isCombineDisplaced);
  console.log('is moving forward?', isMovingForward);
  if (isCombineDisplaced) {
    const isDisplacedForward: boolean = movement.willDisplaceForward;
    console.log('is displaced forward?', isDisplacedForward);
    const displaced: BoxModel = offset(unshifted, movement.displacedBy.point);
    if (isDisplacedForward) {
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
          willDisplaceForward: isDisplacedForward,
          proposedIndex: combine.descriptor.index + 1,
        };
      }
      // moving backward off displacement - into its home index
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
        willDisplaceForward: isDisplacedForward,
        proposedIndex: combine.descriptor.index,
      };
    }
    // is displaced backwards

    // moving forward will leave the displaced item into the spot before it
    if (isMovingForward) {
      const newPageBorderBoxCenter: Position = goAfter({
        axis,
        moveRelativeTo: displaced,
        isMoving: draggable.page,
      });
      return {
        newPageBorderBoxCenter,
        changeDisplacement: {
          type: 'DO_NOTHING',
        },
        willDisplaceForward: isDisplacedForward,
        proposedIndex: combine.descriptor.index + 1,
      };
    }
    // moving backwards will remove the displacement and go into its spot
    const newPageBorderBoxCenter: Position = goBefore({
      axis,
      moveRelativeTo: unshifted,
      isMoving: draggable.page,
    });
    return {
      newPageBorderBoxCenter,
      changeDisplacement: {
        type: 'REMOVE_CLOSEST',
      },
      willDisplaceForward: isDisplacedForward,
      proposedIndex: combine.descriptor.index - 1,
    };
  }

  // is not displaced

  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex: isMovingForward ? combineIndex + 1 : combineIndex - 1,
    startIndexInHome: draggable.descriptor.index,
  });
  console.log('will displace forward?', willDisplaceForward);
  const displaceBy: Position = getDisplacedBy(
    axis,
    draggable.displaceBy,
    willDisplaceForward,
  ).point;
  const displaced: BoxModel = offset(unshifted, displaceBy);

  if (willDisplaceForward) {
    // move after without displacing
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
    // move into and displace forward
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
  }

  // will displace backwards

  // will displace the combine item backwards and move into its spot
  if (isMovingForward) {
    const newPageBorderBoxCenter: Position = goAfter({
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
  }
  // moving backwards

  // IS THIS AN INVALID MOVEMENT?
  console.warn('moving backwards when not displaced ');

  const newPageBorderBoxCenter: Position = goBefore({
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
    proposedIndex: combine.descriptor.index - 1,
  };
};
