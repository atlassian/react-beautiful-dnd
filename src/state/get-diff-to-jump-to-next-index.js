// @flow
import memoizeOne from 'memoize-one';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import { patch } from './position';
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
  DragMovement,
} from '../types';

const getIndex = memoizeOne(
  (draggables: DraggableDimension[],
    target: DraggableDimension
  ): number => draggables.indexOf(target)
);

type GetDiffArgs = {|
  isMovingForward: boolean,
  draggableId: DraggableId,
  impact: DragImpact,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|}

export type GetDiffResult = {|
  diff: Position,
  impact: DragImpact,
|}

export default ({
  isMovingForward,
  draggableId,
  impact,
  draggables,
  droppables,
}: GetDiffArgs): ?GetDiffResult => {
  if (!impact.destination) {
    console.error('cannot move forward when there is not previous destination');
    return null;
  }

  const location: DraggableLocation = impact.destination;
  const droppable: DroppableDimension = droppables[location.droppableId];
  const draggable: DraggableDimension = draggables[draggableId];
  const currentIndex: number = location.index;
  const axis: Axis = droppable.axis;

  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  const startIndex: number = getIndex(insideDroppable, draggable);

  if (startIndex === -1) {
    console.error('could not find draggable inside current droppable');
    return null;
  }

  // cannot move beyond the last item
  if (isMovingForward && currentIndex === insideDroppable.length - 1) {
    return null;
  }

  // cannot move before the first item
  if (!isMovingForward && currentIndex === 0) {
    return null;
  }

  const atCurrentIndex: DraggableDimension = insideDroppable[currentIndex];
  const nextIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;
  const atNextIndex: DraggableDimension = insideDroppable[nextIndex];

  const isMovingTowardStart = (isMovingForward && nextIndex <= startIndex) ||
    (!isMovingForward && nextIndex >= startIndex);

  const distance: number = isMovingTowardStart ?
    atCurrentIndex.page.withMargin[axis.size] :
    atNextIndex.page.withMargin[axis.size];

  const signed: number = isMovingForward ? distance : -distance;

  const diff: Position = patch(axis.line, signed);

  // Calculate DragImpact

  // 1. If moving back towards where we started
  // we need to remove the latest addition
  // 2. If we are moving away from where we started,
  // we need to add the next draggable to the impact
  const moved: DraggableId[] = isMovingTowardStart ?
    impact.movement.draggables.slice(0, impact.movement.draggables.length - 1) :
    [...impact.movement.draggables, atNextIndex.id];

  const movement: DragMovement = {
    draggables: moved,
    // The amount of movement will always be the size of the dragging item
    amount: patch(axis.line, draggable.page.withMargin[axis.size]),
    isBeyondStartPosition: nextIndex > startIndex,
  };

  const newImpact: DragImpact = {
    movement,
    destination: {
      droppableId: droppable.id,
      index: nextIndex,
    },
    direction: droppable.axis.direction,
  };

  const result: GetDiffResult = {
    diff, impact: newImpact,
  };

  return result;
};

