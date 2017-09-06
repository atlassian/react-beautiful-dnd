// @flow
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import { patch } from '../position';
import moveToEdge from '../move-to-edge';
import type { Edge } from '../move-to-edge';
import type { Args, Result } from './jump-to-next-index-types';
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
  console.log('in-foreign-list.js');
  if (!impact.destination) {
    console.error('cannot jump to next index when there is not previous destination');
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
  // Where the draggable will end up
  const proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  // draggable is allowed to exceed the foreign droppables count by 1
  if (proposedIndex > insideForeignDroppable.length) {
    return null;
  }

  // Cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  const atProposedIndex: DraggableDimension = insideForeignDroppable[proposedIndex];
  // The draggable that we are going to move relative to
  const movingRelativeTo: DraggableDimension = insideForeignDroppable[
    // We want to move relative to the previous draggable
    // or to the first if there is no previous
    Math.max(0, proposedIndex - 1)
  ];

  const sourceEdge: Edge = 'start';
  const destinationEdge: Edge = proposedIndex === 0 ? 'start' : 'end';

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
      [atProposedIndex.id, ...impact.movement.draggables];

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
