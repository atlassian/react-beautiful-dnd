// @flow
import getBestCrossAxisDroppable from './get-best-cross-axis-droppable';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import getClosestDraggable from './get-closest-draggable';
import type {
  DraggableId,
  DroppableId,
  Position,
  DragImpact,
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

type Result = {|
  offset: Position,
  impact: DragImpact,
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

  const newSiblings: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  if (!newSiblings.length) {
    // need to move to the start of the list
    console.info('not handled yet!');
    return null;
  }

  // Assumption: list must have same width
  // All good if smaller - but if bigger then it will be a bit messy - up to consumer

  const closestSibling: DroppableDimension = getClosestDraggable({
    axis: destination.axis,
    center,
    scrollOffset: destination.scroll.current,
    draggables: newSiblings,
  });

  // TODO: what if going from a vertical to horizontal list

  // needs to go before the closest if it is before / equal on the main axis
  const isGoingBefore: boolean = center <= closestSibling.page.withMargin.center[source.axis.line];

  // isGoingBefore -> bottom edge of current draggable needs go against top edge of closest
  // !isGoingBefore -> top of of current draggable needs to go again bottom edge of closest

  // also need to force the other draggables to move to needed
};
