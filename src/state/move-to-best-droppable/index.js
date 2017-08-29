// @flow
import getBestCrossAxisDroppable from './get-best-cross-axis-droppable';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import getClosestDraggable from './get-closest-draggable';
import moveToNewSpot from './move-to-new-spot';
import type { Result } from './move-to-new-spot';
import type {
  DraggableId,
  DroppableId,
  Position,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../types';

type Args = {|
  isMovingForward: boolean,
  // the current center of the dragging item
  center: Position,
  // the dragging item
  draggableId: DraggableId,
  // the droppable the dragging item is in
  droppableId: DroppableId,
  // all the dimensions in the system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|}

export default ({
  isMovingForward,
  center,
  draggableId,
  droppableId,
  draggables,
  droppables,
  }: Args): ?Result => {
  const draggable: DraggableDimension = draggables[draggableId];
  const source: DroppableDimension = droppables[droppableId];

  const destination: ?DroppableDimension = getBestCrossAxisDroppable({
    isMovingForward,
    center,
    source,
    droppables,
  });

  // nothing available to move to
  if (!destination) {
    return null;
  }

  // const newSiblings: DraggableDimension[] = getDraggablesInsideDroppable(
  //   destination,
  //   draggables,
  // );

  const target: ?DraggableDimension = getClosestDraggable({
    axis: destination.axis,
    center,
    scrollOffset: destination.scroll.current,
    destination,
    draggables,
  });

  return moveToNewSpot({
    center,
    source,
    destination,
    draggable,
    target,
    draggables,
  });
};
