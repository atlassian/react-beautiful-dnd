// @flow
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { patch } from '../position';
import moveToEdge from '../move-to-edge';
import type { Edge } from '../move-to-edge';
import type { Args, Result } from './move-to-next-index-types';
import type {
  DraggableLocation,
  DraggableDimension,
  Position,
  Axis,
  DragImpact,
  DraggableId,
} from '../../types';

export default ({
  isMovingForward,
  draggableId,
  impact,
  droppable,
  draggables,
}: Args): ?Result => {
  if (!impact.destination) {
    console.error('cannot move to next index when there is not previous destination');
    return null;
  }

  const location: DraggableLocation = impact.destination;
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

  const sourceEdge: Edge = 'start';
  const destinationEdge: Edge = (() => {
    // moving past the last item
    // in this case we are moving relative to the last item
    // as there is nothing at the proposed index.
    if (proposedIndex > lastIndex) {
      return 'end';
    }

    return 'start';
  })();

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge,
    destination: movingRelativeTo.page.withMargin,
    destinationEdge,
    destinationAxis: droppable.axis,
  });

  // When we are in foreign list we are only displacing items forward
  // This list is always sorted by the closest impacted draggable
  const moved: DraggableId[] = isMovingForward ?
      // Stop displacing the closest draggable forward
      impact.movement.draggables.slice(1, impact.movement.draggables.length) :
      // Add the draggable that we are moving into the place of
      [movingRelativeTo.id, ...impact.movement.draggables];

  const newImpact: DragImpact = {
    movement: {
      draggables: moved,
      // The amount of movement will always be the size of the dragging item
      amount: patch(axis.line, draggable.page.withMargin[axis.size]),
      // When we are in foreign list we are only displacing items forward
      isBeyondStartPosition: false,
    },
    destination: {
      droppableId: droppable.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  return {
    pageCenter: newCenter,
    impact: newImpact,
  };
};
