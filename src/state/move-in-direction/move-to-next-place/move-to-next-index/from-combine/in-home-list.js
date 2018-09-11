// @flow
import { offset, type Position, type BoxModel } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
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

  const combineVisualIndex: number = (() => {
    if (!isCombineDisplaced) {
      return combineStartIndex;
    }
    return isDisplacedForward ? combineStartIndex + 1 : combineStartIndex - 1;
  })();

  console.log('is moving forward', isMovingForward);
  console.log('isCombineDisplaced', isCombineDisplaced);
  console.log('will displace forward', willDisplaceForward);
  console.log('displace by', movement.displacedBy.value);
  const unshifted: BoxModel = combine.page;
  if (isCombineDisplaced) {
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
          willDisplaceForward,
          proposedIndex: combine.descriptor.index + 1,
        };
      }
      // moving backwards - should maintain displacement
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
    // displaced backwards

    // should maintain displacement
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
        willDisplaceForward,
        proposedIndex: combine.descriptor.index + 1,
      };
    }
    // should remove displacement
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
      willDisplaceForward,
      proposedIndex: combine.descriptor.index - 1,
    };
  }

  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex,
    startIndexInHome,
  });

  const wouldDisplaceBy: Position = patch(
    axis.line,
    draggable.displaceBy[axis.line] * (willDisplaceForward ? 1 : -1),
  );
  console.log('would displace by', wouldDisplaceBy);
  const displaced: BoxModel = offset(unshifted, wouldDisplaceBy);

  // combine is not displaced
  if (willDisplaceForward) {
    if (isMovingForward) {
      console.log('will displace forward', 'isMovingForward');
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
        proposedIndex: combine.descriptor.index,
      };
    }
    // is moving backwards
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
  // not displaced && will displace backwards

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
      proposedIndex: combine.descriptor.index + 1,
    };
  }
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

  // only for home list for now

  // combine is not displaced
  // console.log('target not displaced - lets figure this out');

  // // this needs to be aware of whether we are in the home or not
  // console.log(
  //   isMovingForward
  //     ? 'move after combine, should displace'
  //     : 'move before combine, do not displace',
  // );

  // displaced forward + moving forward: undo displacement and move into index of displaced item
  // displaced forward + moving backwards: maintain current displacement and move into position of non-displaced item
  // displaced backwards + moving forward:  maintain current displacement and move into position of non-displaced item
  // displaced backwards + moving backward: undo displacement and move into index of displaced item
  // not displaced + moving forward: ???

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
  // console.log('visual indcombineVisualIndexIndex);
};
