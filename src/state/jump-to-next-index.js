// @flow
import memoizeOne from 'memoize-one';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import {
  add,
  patch,
  subtract,
  absolute,
} from './position';
import moveToEdge from './move-to-edge';
import type {
  DraggableLocation,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  Position,
  DraggableId,
  Axis,
  DragImpact,
  DimensionFragment,
} from '../types';

const getIndex = memoizeOne(
  (draggables: DraggableDimension[],
    target: DraggableDimension
  ): number => draggables.indexOf(target)
);

type JumpToNextArgs = {|
  isMovingForward: boolean,
  draggableId: DraggableId,
  // the current center position
  center: Position,
  impact: DragImpact,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|}

export type JumpToNextResult = {|
  center: Position,
  impact: DragImpact,
|}

type ShiftPosition = (point: Position, size: number, axis: Axis) => Position;

const shift = (adjust: (original: Position, modification: Position) => Position): ShiftPosition =>
  (point: Position, size: number, axis: Axis): Position => {
    const amount: Position = patch(axis.line, size);

    return adjust(point, amount);
  };

// const pull =

// const pull: ShiftPosition = shift(subtract, size: number);
// const push: ShiftPosition = shift(add, size: number);

export default ({
  isMovingForward,
  draggableId,
  center,
  impact,
  draggables,
  droppables,
  }: JumpToNextArgs): ?JumpToNextResult => {
  if (!impact.destination) {
    console.error('cannot move forward when there is not previous destination');
    return null;
  }

  const location: DraggableLocation = impact.destination;
  const droppable: DroppableDimension = droppables[location.droppableId];
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
  const atCurrentIndex: DraggableDimension = insideDroppable[currentIndex];

  // if moving forward: move start edge of source to end edge of destination
  // if moving backward: move end edge of source to start edge of destination

  const isMovingTowardStart = (isMovingForward && proposedIndex <= startIndex) ||
    (!isMovingForward && proposedIndex >= startIndex);

  const newCenter: Position = (() => {
    // If moving toward start, just add / remove the size of the dragging item
    // Things have moved out of the way by the size of the dragging item - we are
    // just undoing the movement
    if (isMovingTowardStart) {
      const size = patch(axis.line, destination.page.withMargin[axis.size]);

      return isMovingForward ? add(center, size) : subtract(center, size);
    }

    // if moving away from the start - move to the start edge of the next draggable
    const goal: Position = moveToEdge({
      source: draggable.page.withoutMargin,
      sourceEdge: 'start',
      destination: destination.page.withMargin,
      destinationEdge: 'start',
      destinationAxis: droppable.axis,
    });

    const sizeDiff: Position = patch(
      axis.line,
      draggable.page.withMargin[axis.size] - destination.page.withMargin[axis.size]
    );

    return isMovingForward ? subtract(goal, sizeDiff) : goal;
  })();

  // Calculate DragImpact

  // 1. If moving back towards where we started
  // we need to remove the latest addition
  // 2. If we are moving away from where we started,
  // we need to add the next draggable to the impact
  const moved: DraggableId[] = isMovingTowardStart ?
    impact.movement.draggables.slice(0, impact.movement.draggables.length - 1) :
    [...impact.movement.draggables, destination.id];

  const newImpact: DragImpact = {
    movement: {
      draggables: moved,
      // The amount of movement will always be the size of the dragging item
      amount: patch(axis.line, draggable.page.withMargin[axis.size]),
      isBeyondStartPosition: proposedIndex > startIndex,
    },
    destination: {
      droppableId: droppable.id,
      index: proposedIndex,
    },
    direction: droppable.axis.direction,
  };

  const result: JumpToNextResult = {
    center: newCenter,
    impact: newImpact,
  };

  return result;
};

