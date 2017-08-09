// @flow
import memoizeOne from 'memoize-one';
import getDraggablesInsideDroppable from './get-draggables-inside-droppable';
import type {
  DraggableLocation,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  Position,
  DraggableId,
} from '../types';

const getIndex = memoizeOne(
  (draggables: DraggableDimension[],
    target: DraggableDimension,
  ): number => draggables.indexOf(target),
);

type GetDiffArgs = {|
  isMovingForward: boolean,
  draggableId: DraggableId,
  location: DraggableLocation,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|}

export default ({
  isMovingForward,
  draggableId,
  location,
  draggables,
  droppables,
}: GetDiffArgs): ?Position => {
  const droppable: DroppableDimension = droppables[location.droppableId];
  const draggable: DraggableDimension = draggables[draggableId];
  const currentIndex: number = location.index;

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

  const amount: number = isMovingTowardStart ?
    atCurrentIndex.page.withMargin.height :
    atNextIndex.page.withMargin.height;

  const diff: Position = {
    // not worrying about horizontal for now
    x: 0,
    y: isMovingForward ? amount : -amount,
  };

  return diff;
};

