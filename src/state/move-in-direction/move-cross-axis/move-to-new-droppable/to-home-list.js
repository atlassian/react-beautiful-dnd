// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import getDisplacement from '../../../get-displacement';
import getDisplacementMap from '../../../get-displacement-map';
import getDisplacedBy from '../../../get-displaced-by';
import getWillDisplaceForward from '../../../will-displace-forward';
import getHomeImpact from '../../../get-home-impact';
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
import getPageBorderBoxCenterFromImpact from '../../../get-page-border-box-center-from-impact';

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
    const impact: DragImpact = getHomeImpact(draggable, destination);
    const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
      impact,
      draggable,
      droppable: destination,
      draggables,
    });
    // const newCenter: Position = draggable.page.borderBox.center;

    return {
      type: 'MOVE_CROSS_AXIS',
      impact,
      pageBorderBoxCenter,
      destination,
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

  const impact: DragImpact = {
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

  const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  return {
    type: 'MOVE_CROSS_AXIS',
    pageBorderBoxCenter,
    impact,
    destination,
  };
};
