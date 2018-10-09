// @flow
import invariant from 'tiny-invariant';
import {
  type Position,
  type BoxModel,
  type Spacing,
  offset,
} from 'css-box-model';
import type { InternalResult } from '../../move-in-direction-types';
import getDisplacement from '../../../get-displacement';
import withDroppableDisplacement from '../../../with-scroll-change/with-droppable-displacement';
import getDisplacementMap from '../../../get-displacement-map';
import getDisplacedBy from '../../../get-displaced-by';
import { noMovement } from '../../../no-impact';
import { goIntoStart, goAfter, goBefore } from '../../../move-relative-to';
import { isTotallyVisible } from '../../../visibility/is-visible';
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
  pageBorderBoxCenter: Position,
  moveRelativeTo: ?DraggableDimension,
  insideDestination: DraggableDimension[],
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Viewport,
|};

export default ({
  pageBorderBoxCenter,
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
    const newCenter: Position = goIntoStart({
      axis,
      moveInto: destination.page,
      isMoving: draggable.page,
    });

    // we might not be able to see the position we are hoping to move to
    const fake: Spacing = {
      top: newCenter.y,
      right: newCenter.x,
      bottom: newCenter.y,
      left: newCenter.x,
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

    const newImpact: DragImpact = {
      movement: noMovement,
      direction: axis.direction,
      destination: {
        droppableId: destination.descriptor.id,
        index: 0,
      },
      merge: null,
    };

    return {
      pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
      impact: newImpact,
      scrollJumpRequest: null,
    };
  }

  // Moving to a populated list
  const targetIndex: number = insideDestination.indexOf(moveRelativeTo);
  invariant(targetIndex !== -1, 'Cannot find draggable in foreign list');

  const isGoingBeforeTarget: boolean = Boolean(
    pageBorderBoxCenter[destination.axis.line] <
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

  const newCenter: Position = (() => {
    // nothing displaced, and not an empty list.
    // move below the last item
    if (!displaced.length) {
      const target: DraggableDimension =
        insideDestination[insideDestination.length - 1];
      return goAfter({
        axis,
        moveRelativeTo: target.page,
        isMoving: draggable.page,
      });
    }
    const first: DraggableDimension = draggables[displaced[0].draggableId];
    const withDisplacement: BoxModel = offset(first.page, displacedBy.point);
    return goBefore({
      axis,
      moveRelativeTo: withDisplacement,
      isMoving: draggable.page,
    });
  })();

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
      index: proposedIndex,
    },
    merge: null,
  };

  return {
    pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
    impact: newImpact,
    scrollJumpRequest: null,
  };
};
