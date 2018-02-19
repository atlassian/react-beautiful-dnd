// @flow
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { patch, subtract, absolute } from '../position';
import withDroppableDisplacement from '../with-droppable-displacement';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import getViewport from '../../window/get-viewport';
// import getScrollJumpResult from './get-scroll-jump-result';
import moveToEdge from '../move-to-edge';
import { withFirstAdded, withFirstRemoved } from './get-forced-displaced';
import type { Edge } from '../move-to-edge';
import type { Args, Result } from './move-to-next-index-types';
import type {
  DraggableLocation,
  DraggableDimension,
  Position,
  Displacement,
  Axis,
  DragImpact,
  Area,
} from '../../types';

export default ({
  isMovingForward,
  draggableId,
  previousPageCenter,
  previousImpact,
  droppable,
  draggables,
}: Args): ?Result => {
  const location: ?DraggableLocation = previousImpact.destination;

  if (!location) {
    console.error('cannot move to next index when there is not previous destination');
    return null;
  }

  const draggable: DraggableDimension = draggables[draggableId];
  const axis: Axis = droppable.axis;

  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  const startIndex: number = draggable.descriptor.index;
  const currentIndex: number = location.index;
  const proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  if (startIndex === -1) {
    console.error('could not find draggable inside current droppable');
    return null;
  }

  // cannot move forward beyond the last item
  if (proposedIndex > insideDroppable.length - 1) {
    return null;
  }

  // cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  const viewport: Area = getViewport();
  const destination: DraggableDimension = insideDroppable[proposedIndex];
  const isMovingTowardStart = (isMovingForward && proposedIndex <= startIndex) ||
    (!isMovingForward && proposedIndex >= startIndex);

  const edge: Edge = (() => {
    // is moving away from the start
    if (!isMovingTowardStart) {
      return isMovingForward ? 'end' : 'start';
    }
    // is moving back towards the start
    return isMovingForward ? 'start' : 'end';
  })();

  const newPageCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge: edge,
    destination: destination.page.withoutMargin,
    destinationEdge: edge,
    destinationAxis: droppable.axis,
  });

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination: droppable,
    newPageCenter,
    viewport,
  });

  const displaced: Displacement[] = (() => {
    if (isMovingTowardStart) {
      return withFirstRemoved({
        dragging: draggableId,
        isVisibleInNewLocation,
        previousImpact,
        droppable,
        draggables,
        viewport,
      });
    }
    return withFirstAdded({
      add: destination.descriptor.id,
      previousImpact,
      droppable,
      draggables,
      viewport,
    });
  })();

  const newImpact: DragImpact = {
    movement: {
      displaced,
      amount: patch(axis.line, draggable.page.withMargin[axis.size]),
      isBeyondStartPosition: proposedIndex > startIndex,
    },
    destination: {
      droppableId: droppable.descriptor.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  if (isVisibleInNewLocation) {
    return {
      pageCenter: withDroppableDisplacement(droppable, newPageCenter),
      impact: newImpact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const distance: Position = subtract(newPageCenter, previousPageCenter);
  const distanceWithScroll: Position = withDroppableDisplacement(droppable, distance);

  return {
    pageCenter: previousPageCenter,
    impact: newImpact,
    scrollJumpRequest: distanceWithScroll,
  };
};
