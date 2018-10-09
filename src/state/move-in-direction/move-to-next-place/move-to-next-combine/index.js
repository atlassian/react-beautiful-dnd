// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  CombineImpact,
  DraggableLocation,
  Viewport,
} from '../../../../types';
import type { InternalResult } from '../../move-in-direction-types';
import withDroppableDisplacement from '../../../with-scroll-change/with-droppable-displacement';
import { add } from '../../../position';
import withScrollRequest from '../with-scroll-request';
import isTotallyVisibleInNewLocation from '../is-totally-visible-in-new-location';
import {
  forward,
  backward,
} from '../../../user-direction/user-direction-preset';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  previousPageBorderBoxCenter: Position,
  viewport: Viewport,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  destination,
  insideDestination,
  previousImpact,
  previousPageBorderBoxCenter,
  viewport,
}: Args): ?InternalResult => {
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
  const isTargetDisplaced: boolean = Boolean(
    previousImpact.movement.map[target.descriptor.id],
  );
  const targetCenter: Position = target.page.borderBox.center;
  const withDisplacement: Position = isTargetDisplaced
    ? add(targetCenter, previousImpact.movement.displacedBy.point)
    : targetCenter;
  const newPageBorderBoxCenter: Position = withDroppableDisplacement(
    destination,
    withDisplacement,
  );

  const merge: CombineImpact = {
    whenEntered: isMovingForward ? forward : backward,
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };

  const newImpact: DragImpact = {
    // grouping does not modify the existing displacement
    movement: previousImpact.movement,
    // grouping removes the destination
    destination: null,
    direction: destination.axis.direction,
    merge,
  };

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageBorderBoxCenter,
    viewport: viewport.frame,
    // not applying the displacement of the droppable for this check
    // we are only interested in the page location of the dragging item
    withDroppableDisplacement: false,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  return withScrollRequest({
    previousPageBorderBoxCenter,
    newPageBorderBoxCenter,
    impact: newImpact,
    isVisibleInNewLocation,
  });
};
