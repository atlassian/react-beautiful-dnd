// @flow
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
  }): ?Result => {
  const draggable: DraggableDimension = draggables[draggableId];

  const destination: ?DroppableDimension = getBestCrossAxisDroppable({
    isMovingForward,
    center,
    source: draggable,
    droppables,
  });

  // nothing available to move to
  if (!destination) {
    return null;
  }

  const children: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  if (!children.length) {
    // need to move to the top of the list
    console.info('not handled yet!');
    return null;
  }

  const closest: DroppableDimension = getClosestDraggable({
    axis: destination.axis,
    center,
    draggables: children,
  });

  // TODO: what if going from a vertical to horizontal list

  // needs to go before the closest if it is before / equal on the main axis
  const isGoingBefore: boolean = center <= closest.page.withMargin.center[source.axis.line];

  // isGoingBefore -> bottom edge of current draggable needs go against top edge of closest
  // !isGoingBefore -> top of of current draggable needs to go again bottom edge of closest

  // also need to force the other draggables to move to needed
};
