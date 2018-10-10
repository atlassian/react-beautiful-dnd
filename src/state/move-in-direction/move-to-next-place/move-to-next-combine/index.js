// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  DraggableDimensionMap,
  CombineImpact,
  DraggableLocation,
  DisplacedBy,
} from '../../../../types';
import {
  forward,
  backward,
} from '../../../user-direction/user-direction-preset';
import getPageBorderBoxCenterFromImpact from '../../../get-page-border-box-center-from-impact';
import getDisplacedBy from '../../../get-displaced-by';
import getWillDisplaceForward from '../../../will-displace-forward';
import type { MoveResult } from '../move-to-next-place-types';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  draggables,
  destination,
  insideDestination,
  previousImpact,
}: Args): ?MoveResult => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  // we move from a merge to a reorder
  if (previousImpact.merge) {
    return null;
  }

  const location: ?DraggableLocation = previousImpact.destination;
  invariant(location, 'previous location required for combining');

  const currentIndex: number = location.index;

  // When finding the target we need to consider displacement
  // We need to move onto things in their current displacement

  const current: DraggableDimension[] = (() => {
    const shallow = insideDestination.slice();

    if (isInHomeList) {
      shallow.splice(draggable.descriptor.index, 1);
    }
    shallow.splice(location.index, 0, draggable);
    return shallow;
  })();

  const targetIndex: number = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;

  if (targetIndex < 0) {
    return null;
  }

  // The last item that can be grouped with is the last one
  if (targetIndex > current.length - 1) {
    return null;
  }

  const target: DraggableDimension = current[targetIndex];

  const merge: CombineImpact = {
    whenEntered: isMovingForward ? forward : backward,
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };
  console.group('mergin');

  // const movement: DragMovement = (() => {
  //   if(targetIndex === )
  // })();

  // const isTargetDisplacedForward: boolean =
  console.warn('targetIndex', targetIndex);

  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList,
    proposedIndex: targetIndex,
    startIndexInHome: draggable.descriptor.index,
  });
  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
    willDisplaceForward,
  );
  console.log(
    'old willDisplaceForward',
    previousImpact.movement.willDisplaceForward,
  );

  console.log('new: willDisplaceForward', willDisplaceForward);

  const impact: DragImpact = {
    // grouping does not modify the existing displacement
    movement: {
      ...previousImpact.movement,
      willDisplaceForward,
      displacedBy,
    },
    // grouping removes the destination
    destination: null,
    direction: destination.axis.direction,
    merge,
  };

  console.log('impact', impact);
  console.groupEnd();

  const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  return {
    pageBorderBoxCenter,
    impact,
  };
};
