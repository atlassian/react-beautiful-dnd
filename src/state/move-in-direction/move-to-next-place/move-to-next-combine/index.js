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
  Viewport,
} from '../../../../types';
import type { InternalResult } from '../../move-in-direction-types';
import isTotallyVisibleInNewLocation from '../is-totally-visible-in-new-location';
import {
  forward,
  backward,
} from '../../../user-direction/user-direction-preset';
import getPageBorderBoxCenterFromImpact from '../../../get-page-border-box-center-from-impact';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  draggables,
  destination,
  insideDestination,
  previousImpact,
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

  const merge: CombineImpact = {
    whenEntered: isMovingForward ? forward : backward,
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };

  const impact: DragImpact = {
    // grouping does not modify the existing displacement
    movement: previousImpact.movement,
    // grouping removes the destination
    destination: null,
    direction: destination.axis.direction,
    merge,
  };

  const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageBorderBoxCenter: pageBorderBoxCenter,
    viewport: viewport.frame,
    withDroppableDisplacement: true,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  if (isVisibleInNewLocation) {
    return {
      type: 'MOVE',
      pageBorderBoxCenter,
      impact,
    };
  }

  throw new Error('TODO');
};
