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

  // const startIndex: ?number = impact.foreignDestinationStartIndex;
  const currentIndex: number = location.index;
  const proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  // TODO
  if (proposedIndex > insideForeignDroppable.length) {
    return null;
  }

  // cannot move before the first item
  if (proposedIndex < 0) {
    return null;
  }

  const atProposedIndex: DraggableDimension = insideForeignDroppable[proposedIndex];
  const destinationIndex = Math.max(0, proposedIndex - 1);
  const destination: DraggableDimension = insideForeignDroppable[destinationIndex];
  console.log('destination', destination.id);

  const sourceEdge: Edge = 'start';
  const destinationEdge: Edge = proposedIndex === 0 ? 'start' : 'end';

  const newCenter: Position = moveToEdge({
    source: draggable.page.withoutMargin,
    sourceEdge,
    destination: destination.page.withMargin,
    destinationEdge,
    destinationAxis: droppable.axis,
  });

  const moved: DraggableId[] = isMovingForward ?
      impact.movement.draggables.slice(1, impact.movement.draggables.length) :
      [atProposedIndex.id, ...impact.movement.draggables];

  const newImpact: DragImpact = {
    movement: {
      draggables: moved,
      // The amount of movement will always be the size of the dragging item
      amount: patch(axis.line, draggable.page.withMargin[axis.size]),
      // when in another list we are never past the start position
      isBeyondStartPosition: false,
    },
    destination: {
      droppableId: droppable.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  return {
    center: newCenter,
    impact: newImpact,
  };
};
