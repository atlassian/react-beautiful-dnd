// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import type {
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
import isHomeOf from '../../droppable/is-home-of';

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
  if (!moveRelativeTo) {
    // Draggables available, but none are candidates for movement
    if (insideDestination.length) {
      return null;
    }

    // Try move to top of empty list if it is visible
    const proposed: DragImpact = {
      movement: noMovement,
      destination: {
        droppableId: destination.descriptor.id,
        index: 0,
      },
      merge: null,
    };
    const proposedPageBorderBoxCenter: Position = getPageBorderBoxCenter({
      impact: proposed,
      draggable,
      droppable: destination,
      draggables,
      onLift,
    });

    // need to add room for a placeholder in a foreign list
    const withPlaceholder: DroppableDimension = isHomeOf(draggable, destination)
      ? destination
      : addPlaceholder(destination, draggable, draggables);

    const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
      draggable,
      destination: withPlaceholder,
      newPageBorderBoxCenter: proposedPageBorderBoxCenter,
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

  const proposedIndex: number = (() => {
    const relativeTo: number = moveRelativeTo.descriptor.index;

    if (moveRelativeTo.descriptor.id === draggable.descriptor.id) {
      return relativeTo;
    }

    if (isGoingBeforeTarget) {
      return relativeTo;
    }

    return relativeTo + 1;
  })();

  const sliceFrom: number = (() => {
    const firstIndex: number = insideDestination[0].descriptor.index;
    return proposedIndex - firstIndex;
  })();

  console.log(
    {
      moveRelativeTo: moveRelativeTo.descriptor.id,
      sliceFrom,
      proposedIndex,
      // isGoingBeforeTarget,
    },
    {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
  );

  const displaced: Displacement[] = removeDraggableFromList(
    draggable,
    insideDestination,
  )
    .slice(sliceFrom)
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
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
    merge: null,
  };
  return impact;
};
