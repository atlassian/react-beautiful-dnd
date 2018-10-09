// @flow
import type { Position, Spacing } from 'css-box-model';
import invariant from 'tiny-invariant';
import getDisplacedBy from '../../../get-displaced-by';
import getDisplacement from '../../../get-displacement';
import getDisplacementMap from '../../../get-displacement-map';
import getPageBorderBoxCenterFromImpact from '../../../get-page-border-box-center-from-impact';
import { noMovement } from '../../../no-impact';
import { isTotallyVisible } from '../../../visibility/is-visible';
import type { InternalResult } from '../../move-in-direction-types';
import type {
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  Displacement,
  Viewport,
  DisplacedBy,
} from '../../../../types';

type Args = {|
  previousPageBorderBoxCenter: Position,
  moveRelativeTo: ?DraggableDimension,
  insideDestination: DraggableDimension[],
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Viewport,
|};

export default ({
  previousPageBorderBoxCenter,
  moveRelativeTo,
  insideDestination,
  draggable,
  draggables,
  destination,
  previousImpact,
  viewport,
}: Args): ?InternalResult => {
  const axis: Axis = destination.axis;

  // Moving to an empty list
  if (!moveRelativeTo || !insideDestination.length) {
    const impact: DragImpact = {
      movement: noMovement,
      direction: axis.direction,
      destination: {
        droppableId: destination.descriptor.id,
        index: 0,
      },
      merge: null,
    };

    const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
      impact,
      draggable,
      droppable: destination,
      draggables,
    });

    // we might not be able to see the position we are hoping to move to
    const fake: Spacing = {
      top: pageBorderBoxCenter.y,
      right: pageBorderBoxCenter.x,
      bottom: pageBorderBoxCenter.y,
      left: pageBorderBoxCenter.x,
    };
    const isVisible: boolean = isTotallyVisible({
      target: fake,
      destination,
      viewport: viewport.frame,
      withDroppableDisplacement: true,
    });

    if (!isVisible) {
      return null;
    }

    return {
      type: 'MOVE',
      pageBorderBoxCenter,
      impact,
    };
  }

  // Moving to a populated list
  const targetIndex: number = insideDestination.indexOf(moveRelativeTo);
  invariant(targetIndex !== -1, 'Cannot find draggable in foreign list');

  const isGoingBeforeTarget: boolean = Boolean(
    previousPageBorderBoxCenter[destination.axis.line] <
      moveRelativeTo.page.borderBox.center[destination.axis.line],
  );

  const proposedIndex: number = isGoingBeforeTarget
    ? targetIndex
    : targetIndex + 1;

  const displaced: Displacement[] = insideDestination.slice(proposedIndex).map(
    (dimension: DraggableDimension): Displacement =>
      getDisplacement({
        draggable: dimension,
        destination,
        viewport: viewport.frame,
        previousImpact,
      }),
  );

  const willDisplaceForward: boolean = true;
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
      index: proposedIndex,
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
    type: 'MOVE',
    pageBorderBoxCenter,
    impact,
  };
};
