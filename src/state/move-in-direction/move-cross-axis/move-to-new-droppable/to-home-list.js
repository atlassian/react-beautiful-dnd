// @flow
import invariant from 'tiny-invariant';
import { type Position, type BoxModel, offset } from 'css-box-model';
import getDisplacement from '../../../get-displacement';
import withDroppableDisplacement from '../../../with-scroll-change/with-droppable-displacement';
import getDisplacementMap from '../../../get-displacement-map';
import { noMovement } from '../../../no-impact';
import getDisplacedBy from '../../../get-displaced-by';
import getWillDisplaceForward from '../../../will-displace-forward';
import { goBefore, goAfter } from '../../../move-relative-to';
import type { InternalResult } from '../../move-in-direction-types';
import type {
  Axis,
  Viewport,
  Displacement,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DisplacedBy,
} from '../../../../types';

type Args = {|
  moveIntoIndexOf: ?DraggableDimension,
  insideDestination: DraggableDimension[],
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Viewport,
|};

export default ({
  moveIntoIndexOf,
  insideDestination,
  draggable,
  draggables,
  destination,
  previousImpact,
  viewport,
}: Args): ?InternalResult => {
  // this can happen when the position is not visible
  if (!moveIntoIndexOf) {
    return null;
  }

  const axis: Axis = destination.axis;
  const homeIndex: number = draggable.descriptor.index;
  const targetIndex: number = moveIntoIndexOf.descriptor.index;

  // Moving back to original index
  // Super simple - just move it back to the original center with no impact
  if (homeIndex === targetIndex) {
    const newCenter: Position = draggable.page.borderBox.center;

    return {
      pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
      // TODO: use getHomeImpact (this is just copied)
      impact: {
        movement: noMovement,
        direction: axis.direction,
        destination: {
          index: homeIndex,
          droppableId: draggable.descriptor.droppableId,
        },
        merge: null,
      },
      scrollJumpRequest: null,
    };
  }

  const willDisplaceForward: boolean = getWillDisplaceForward({
    isInHomeList: true,
    proposedIndex: targetIndex,
    startIndexInHome: homeIndex,
  });

  const isMovingAfterStart: boolean = !willDisplaceForward;
  // Which draggables will need to move?
  // Everything between the target index and the start index
  const modified: DraggableDimension[] = isMovingAfterStart
    ? // we will be displacing these items backwards
      // homeIndex + 1 so we don't include the home
      // .reverse() so the closest displaced will be first
      insideDestination.slice(homeIndex + 1, targetIndex + 1).reverse()
    : insideDestination.slice(targetIndex, homeIndex);

  const displaced: Displacement[] = modified.map(
    (dimension: DraggableDimension): Displacement =>
      getDisplacement({
        draggable: dimension,
        destination,
        previousImpact,
        viewport: viewport.frame,
      }),
  );

  invariant(
    displaced.length,
    'Must displace as least one thing if not moving into the home index',
  );

  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
    willDisplaceForward,
  );

  const closest: DraggableDimension = draggables[displaced[0].draggableId];

  const closestWhenDisplaced: BoxModel = offset(
    closest.page,
    displacedBy.point,
  );

  const moveArgs = {
    axis: destination.axis,
    moveRelativeTo: closestWhenDisplaced,
    isMoving: draggable.page,
  };

  const newCenter: Position = isMovingAfterStart
    ? goAfter(moveArgs)
    : goBefore(moveArgs);

  const newImpact: DragImpact = {
    movement: {
      displacedBy,
      displaced,
      map: getDisplacementMap(displaced),
      willDisplaceForward,
    },
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: targetIndex,
    },
    merge: null,
  };

  return {
    pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
    impact: newImpact,
    scrollJumpRequest: null,
  };
};
