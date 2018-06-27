// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import { patch, subtract } from '../../position';
import withDroppableDisplacement from '../../with-droppable-displacement';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import moveToEdge from '../../move-to-edge';
import { withFirstAdded, withFirstRemoved } from './get-forced-displacement';
import type { Edge } from '../../move-to-edge';
import type { Args, Result } from './move-to-next-index-types';
import type {
  DraggableLocation,
  DraggableDimension,
  Displacement,
  Axis,
  DragImpact,
} from '../../../types';

export default ({
  isMovingForward,
  draggableId,
  previousPageBorderBoxCenter,
  previousImpact,
  droppable,
  draggables,
  viewport,
}: Args): ?Result => {
  const location: ?DraggableLocation = previousImpact.destination;
  invariant(
    location,
    'Cannot move to next index in home list when there is no previous destination',
  );

  const draggable: DraggableDimension = draggables[draggableId];
  const axis: Axis = droppable.axis;

  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  const startIndex: number = draggable.descriptor.index;
  const currentIndex: number = location.index;
  const proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  // cannot move forward beyond the last item
  if (proposedIndex > insideDroppable.length - 1) {
    return null;
  }

  // cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  const destination: DraggableDimension = insideDroppable[proposedIndex];
  const isMovingTowardStart =
    (isMovingForward && proposedIndex <= startIndex) ||
    (!isMovingForward && proposedIndex >= startIndex);

  const edge: Edge = (() => {
    // is moving away from the start
    if (!isMovingTowardStart) {
      return isMovingForward ? 'end' : 'start';
    }
    // is moving back towards the start
    return isMovingForward ? 'start' : 'end';
  })();

  const newPageBorderBoxCenter: Position = moveToEdge({
    source: draggable.page.borderBox,
    sourceEdge: edge,
    destination: destination.page.borderBox,
    destinationEdge: edge,
    destinationAxis: droppable.axis,
  });

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination: droppable,
    newPageBorderBoxCenter,
    viewport: viewport.frame,
  });

  const displaced: Displacement[] = isMovingTowardStart
    ? withFirstRemoved({
        dragging: draggableId,
        isVisibleInNewLocation,
        previousImpact,
        droppable,
        draggables,
      })
    : withFirstAdded({
        add: destination.descriptor.id,
        previousImpact,
        droppable,
        draggables,
        viewport,
      });

  const newImpact: DragImpact = {
    movement: {
      displaced,
      amount: patch(axis.line, draggable.page.marginBox[axis.size]),
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
      pageBorderBoxCenter: withDroppableDisplacement(
        droppable,
        newPageBorderBoxCenter,
      ),
      impact: newImpact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const distance: Position = subtract(
    newPageBorderBoxCenter,
    previousPageBorderBoxCenter,
  );
  const distanceWithScroll: Position = withDroppableDisplacement(
    droppable,
    distance,
  );

  return {
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    impact: newImpact,
    scrollJumpRequest: distanceWithScroll,
  };
};
