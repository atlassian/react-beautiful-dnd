// @flow
import memoizeOne from 'memoize-one';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { patch } from '../position';
import isVisibleInNewLocation from './is-visible-in-new-location';
import getViewport from '../visibility/get-viewport';
import moveToEdge from '../move-to-edge';
import type { Edge } from '../move-to-edge';
import type { Args, Result } from './move-to-next-index-types';
import getDisplacement from '../get-displacement';
import type {
  DraggableLocation,
  DraggableDimension,
  Position,
  Displacement,
  Axis,
  DragImpact,
  Area,
} from '../../types';

const getIndex = memoizeOne(
  (draggables: DraggableDimension[],
    target: DraggableDimension
  ): number => draggables.indexOf(target)
);

export default ({
  isMovingForward,
  draggableId,
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

  const startIndex: number = getIndex(insideDroppable, draggable);
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

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge: edge,
    destination: destination.page.withoutMargin,
    destinationEdge: edge,
    destinationAxis: droppable.axis,
  });

  const viewport: Area = getViewport();

  const isVisible: boolean = isVisibleInNewLocation({
    draggable,
    destination: droppable,
    newCenter,
    viewport,
  });

  if (!isVisible) {
    return null;
  }

  // Calculate DragImpact
  // at this point we know that the destination is droppable
  const destinationDisplacement: Displacement = {
    draggableId: destination.descriptor.id,
    isVisible: true,
    shouldAnimate: true,
  };

  const modified: Displacement[] = (isMovingTowardStart ?
    // remove the most recently impacted
    previousImpact.movement.displaced.slice(1, previousImpact.movement.displaced.length) :
    // add the destination as the most recently impacted
    [destinationDisplacement, ...previousImpact.movement.displaced]);

  // update impact with visibility - stops redundant work!
  const displaced: Displacement[] = modified
    .map((displacement: Displacement): Displacement => {
      const target: DraggableDimension = draggables[displacement.draggableId];

      const updated: Displacement = getDisplacement({
        draggable: target,
        destination: droppable,
        previousImpact,
        viewport,
      });

      return updated;
    });

  const newImpact: DragImpact = {
    movement: {
      displaced,
      // The amount of movement will always be the size of the dragging item
      amount: patch(axis.line, draggable.page.withMargin[axis.size]),
      isBeyondStartPosition: proposedIndex > startIndex,
    },
    destination: {
      droppableId: droppable.descriptor.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  const result: Result = {
    pageCenter: newCenter,
    impact: newImpact,
  };

  return result;
};
