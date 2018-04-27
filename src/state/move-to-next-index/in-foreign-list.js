// @flow
import { type Position } from 'css-box-model';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { patch, subtract } from '../position';
import withDroppableDisplacement from '../with-droppable-displacement';
import moveToEdge from '../move-to-edge';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import { withFirstAdded, withFirstRemoved } from './get-forced-displacement';
import type { Edge } from '../move-to-edge';
import type { Args, Result } from './move-to-next-index-types';
import type {
  DraggableLocation,
  DraggableDimension,
  Axis,
  DragImpact,
  Displacement,
} from '../../types';

export default ({
  isMovingForward,
  draggableId,
  previousImpact,
  previousPageBorderBoxCenter,
  droppable,
  draggables,
  viewport,
}: Args): ?Result => {
  if (!previousImpact.destination) {
    console.error('cannot move to next index when there is not previous destination');
    return null;
  }

  const location: DraggableLocation = previousImpact.destination;
  const draggable: DraggableDimension = draggables[draggableId];
  const axis: Axis = droppable.axis;

  const insideForeignDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  const currentIndex: number = location.index;
  const proposedIndex: number = isMovingForward ? currentIndex + 1 : currentIndex - 1;
  const lastIndex: number = insideForeignDroppable.length - 1;

  // draggable is allowed to exceed the foreign droppables count by 1
  if (proposedIndex > insideForeignDroppable.length) {
    return null;
  }

  // Cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  // Always moving relative to the draggable at the current index
  const movingRelativeTo: DraggableDimension = insideForeignDroppable[
    // We want to move relative to the proposed index
    // or if we are going beyond to the end of the list - use that index
    Math.min(proposedIndex, lastIndex)
  ];

  const isMovingPastLastIndex: boolean = proposedIndex > lastIndex;
  const sourceEdge: Edge = 'start';
  const destinationEdge: Edge = (() => {
    // moving past the last item
    // in this case we are moving relative to the last item
    // as there is nothing at the proposed index.
    if (isMovingPastLastIndex) {
      return 'end';
    }

    return 'start';
  })();

  const newPageBorderBoxCenter: Position = moveToEdge({
    source: draggable.page.borderBox,
    sourceEdge,
    destination: movingRelativeTo.page.marginBox,
    destinationEdge,
    destinationAxis: droppable.axis,
  });

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination: droppable,
    newPageBorderBoxCenter,
    viewport: viewport.subject,
  });

  const displaced: Displacement[] = (() => {
    if (isMovingForward) {
      return withFirstRemoved({
        dragging: draggableId,
        isVisibleInNewLocation,
        previousImpact,
        droppable,
        draggables,
      });
    }
    return withFirstAdded({
      add: movingRelativeTo.descriptor.id,
      previousImpact,
      droppable,
      draggables,
      viewport,
    });
  })();

  const newImpact: DragImpact = {
    movement: {
      displaced,
      amount: patch(axis.line, draggable.page.marginBox[axis.size]),
      // When we are in foreign list we are only displacing items forward
      isBeyondStartPosition: false,
    },
    destination: {
      droppableId: droppable.descriptor.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  if (isVisibleInNewLocation) {
    return {
      pageBorderBoxCenter: withDroppableDisplacement(droppable, newPageBorderBoxCenter),
      impact: newImpact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const distanceMoving: Position = subtract(newPageBorderBoxCenter, previousPageBorderBoxCenter);
  const distanceWithScroll: Position = withDroppableDisplacement(droppable, distanceMoving);

  return {
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    impact: newImpact,
    scrollJumpRequest: distanceWithScroll,
  };
};
