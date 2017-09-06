// @flow
import getBestCrossAxisDroppable from './get-best-cross-axis-droppable';
import getClosestDraggable from './get-closest-draggable';
import moveToNewDroppable from './move-to-new-droppable/';
import type { Result } from './move-to-new-droppable';
import type {
  DraggableId,
  DroppableId,
  Position,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableLocation,
  DragImpact,
} from '../../types';

type Args = {|
  isMovingForward: boolean,
  // the current page center of the dragging item
  pageCenter: Position,
  // the dragging item
  draggableId: DraggableId,
  // the droppable the dragging item is in
  droppableId: DroppableId,
  // the original location of the draggable
  home: DraggableLocation,
  // the current drag impact
  impact: DragImpact,
  // all the dimensions in the system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|}

export default ({
  isMovingForward,
  pageCenter,
  draggableId,
  droppableId,
  home,
  draggables,
  impact,
  droppables,
  }: Args): ?Result => {
  const draggable: DraggableDimension = draggables[draggableId];
  const source: DroppableDimension = droppables[droppableId];

  const destination: ?DroppableDimension = getBestCrossAxisDroppable({
    isMovingForward,
    pageCenter,
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
    pageCenter,
    scrollOffset: destination.scroll.current,
    destination,
    draggables,
  });

  return moveToNewDroppable({
    pageCenter,
    draggable,
    target,
    source,
    destination,
    home,
    impact,
    draggables,
  });
};
