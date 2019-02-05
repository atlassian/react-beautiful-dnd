// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import type {
  Axis,
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimension,
  Displacement,
  Viewport,
  DisplacedBy,
  OnLift,
} from '../../../types';
import getDisplacedBy from '../../get-displaced-by';
import getDisplacement from '../../get-displacement';
import getDisplacementMap from '../../get-displacement-map';
import { noMovement } from '../../no-impact';
import getPageBorderBoxCenter from '../../get-center-from-impact/get-page-border-box-center';
import isTotallyVisibleInNewLocation from '../move-to-next-place/is-totally-visible-in-new-location';
import { addPlaceholder } from '../../droppable/with-placeholder';
import removeDraggableFromList from '../../remove-draggable-from-list';

type Args = {|
  previousPageBorderBoxCenter: Position,
  moveRelativeTo: ?DraggableDimension,
  insideDestination: DraggableDimension[],
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Viewport,
  onLift: OnLift,
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
  onLift,
}: Args): ?DragImpact => {
  const axis: Axis = destination.axis;

  if (!moveRelativeTo) {
    // Draggables available, but none are candidates for movement
    if (insideDestination.length) {
      return null;
    }

    // Try move to top of empty list if it is visible
    const proposed: DragImpact = {
      movement: noMovement,
      direction: axis.direction,
      destination: {
        droppableId: destination.descriptor.id,
        index: 0,
      },
      merge: null,
    };
    const pageBorderBoxCenter: Position = getPageBorderBoxCenter({
      impact: proposed,
      draggable,
      droppable: destination,
      draggables,
      onLift,
    });

    // need to check as if room was already added
    // note: will not add placeholder space to home
    const withPlaceholder: DroppableDimension = addPlaceholder(
      destination,
      draggable,
      draggables,
    );

    const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
      draggable,
      destination: withPlaceholder,
      newPageBorderBoxCenter: pageBorderBoxCenter,
      viewport: viewport.frame,
      // already taken into account by getPageBorderBoxCenter
      withDroppableDisplacement: false,
      onlyOnMainAxis: true,
    });

    return isVisibleInNewLocation ? proposed : null;
  }

  const isGoingBeforeTarget: boolean = Boolean(
    previousPageBorderBoxCenter[destination.axis.line] <
      moveRelativeTo.page.borderBox.center[destination.axis.line],
  );

  // Moving to a populated list
  const targetIndex: number = insideDestination.indexOf(moveRelativeTo);
  invariant(targetIndex !== -1, 'Cannot find target in list');

  const proposedIndex: number = (() => {
    // TODO: is this logic correct?
    if (moveRelativeTo.descriptor.id === draggable.descriptor.id) {
      return targetIndex;
    }

    if (isGoingBeforeTarget) {
      return targetIndex;
    }

    return targetIndex + 1;
  })();

  const displaced: Displacement[] = removeDraggableFromList(
    draggable,
    insideDestination,
  )
    .slice(proposedIndex)
    .map(
      (dimension: DraggableDimension): Displacement =>
        getDisplacement({
          draggable: dimension,
          destination,
          viewport: viewport.frame,
          previousImpact,
          onLift,
        }),
    );

  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
  );

  const impact: DragImpact = {
    movement: {
      displacedBy,
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
  return impact;
};
