// @flow
import getBestCrossAxisDroppable from './get-best-cross-axis-droppable';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import getClosestDraggable from './get-closest-draggable';
import { subtract } from '../position';
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

export default ({
  isMovingForward,
  center,
  draggableId,
  droppableId,
  draggables,
  droppables,
  }: Args): ?Position => {
  const draggable: DraggableDimension = draggables[draggableId];
  const source: DroppableDimension = droppables[droppableId];

  const destination: ?DroppableDimension = getBestCrossAxisDroppable({
    isMovingForward,
    center,
    source,
    droppables,
  });

  console.log('desintation', destination);

  // nothing available to move to
  if (!destination) {
    console.log('no destination found');
    return null;
  }

  const newSiblings: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  console.log('new siblings', newSiblings);

  if (!newSiblings.length) {
    // need to move to the start of the list
    console.info('not handled yet!');
    return null;
  }

  // Assumption: list must have same width
  // All good if smaller - but if bigger then it will be a bit messy - up to consumer

  const closestSibling: DraggableDimension = getClosestDraggable({
    axis: destination.axis,
    center,
    scrollOffset: destination.scroll.current,
    draggables: newSiblings,
  });

  console.log('closest', closestSibling);

  // TODO: what if going from a vertical to horizontal list

  // needs to go before the closest if it is before / equal on the main axis
  // Keep in mind that an item 'before' another will have a smaller value on the viewport
  const isGoingBefore: boolean = center[source.axis.line] < closestSibling.page.withMargin.center[source.axis.line];

  // also need to force the other draggables to move to needed
  console.log('is going before?', isGoingBefore);

  // need to line up the top/bottom edge
  // need to align to the center position
  const newHome: Position = {
    x: closestSibling.page.withMargin.center.x,
    y: (closestSibling.page.withMargin[isGoingBefore ? 'top' : 'bottom']) + (draggable.page.withMargin.height / 2),
  };

  const offset: Position = subtract(newHome, center);

  return offset;
};
