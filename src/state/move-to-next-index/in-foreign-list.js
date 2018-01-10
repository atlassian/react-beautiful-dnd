// @flow
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { patch } from '../position';
import moveToEdge from '../move-to-edge';
import getDisplacement from '../get-displacement';
import getViewport from '../visibility/get-viewport';
import isVisibleInNewLocation from './is-visible-in-new-location';
import type { Edge } from '../move-to-edge';
import type { Args, Result } from './move-to-next-index-types';
import type {
  DraggableLocation,
  DraggableDimension,
  Position,
  Axis,
  DragImpact,
  Displacement,
  Area,
} from '../../types';

export default ({
  isMovingForward,
  draggableId,
  previousImpact,
  droppable,
  draggables,
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

  const viewport: Area = getViewport();
  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge,
    destination: movingRelativeTo.page.withMargin,
    destinationEdge,
    destinationAxis: droppable.axis,
  });

  const isVisible: boolean = (() => {
    // Moving into placeholder position
    // Usually this would be outside of the visible bounds
    if (isMovingPastLastIndex) {
      return true;
    }

    // checking the shifted draggable rather than just the new center
    // as the new center might not be visible but the whole draggable
    // might be partially visible
    return isVisibleInNewLocation({
      draggable,
      destination: droppable,
      newCenter,
      viewport,
    });
  })();

  if (!isVisible) {
    return null;
  }

  // at this point we know that the destination is droppable
  const movingRelativeToDisplacement: Displacement = {
    draggableId: movingRelativeTo.descriptor.id,
    isVisible: true,
    shouldAnimate: true,
  };

  // When we are in foreign list we are only displacing items forward
  // This list is always sorted by the closest impacted draggable
  const modified: Displacement[] = (isMovingForward ?
    // Stop displacing the closest draggable forward
    previousImpact.movement.displaced.slice(1, previousImpact.movement.displaced.length) :
    // Add the draggable that we are moving into the place of
    [movingRelativeToDisplacement, ...previousImpact.movement.displaced]);

  // update displacement to consider viewport and droppable visibility
  const displaced: Displacement[] = modified
    .map((displacement: Displacement): Displacement => {
    // already processed
      if (displacement === movingRelativeToDisplacement) {
        return displacement;
      }

      const target: DraggableDimension = draggables[displacement.draggableId];

      const updated: Displacement = getDisplacement({
        draggable: target,
        destination: droppable,
        viewport,
        previousImpact,
      });

      return updated;
    });

  const newImpact: DragImpact = {
    movement: {
      displaced,
      // The amount of movement will always be the size of the dragging item
      amount: patch(axis.line, draggable.page.withMargin[axis.size]),
      // When we are in foreign list we are only displacing items forward
      isBeyondStartPosition: false,
    },
    destination: {
      droppableId: droppable.descriptor.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  return {
    pageCenter: newCenter,
    impact: newImpact,
  };
};
