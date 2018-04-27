// @flow
import { type Position } from 'css-box-model';
import getBestCrossAxisDroppable from './get-best-cross-axis-droppable';
import getClosestDraggable from './get-closest-draggable';
import moveToNewDroppable from './move-to-new-droppable/';
import noImpact from '../no-impact';
import getDraggablesInsideDroppable from '../get-draggables-inside-droppable';
import type { Result } from './move-cross-axis-types';
import type {
  DraggableId,
  DroppableId,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableLocation,
  DragImpact,
  Viewport,
} from '../../types';

type Args = {|
  isMovingForward: boolean,
  // the current page center of the dragging item
  pageBorderBoxCenter: Position,
  // the dragging item
  draggableId: DraggableId,
  // the droppable the dragging item is in
  droppableId: DroppableId,
  // the original location of the draggable
  home: DraggableLocation,
  // all the dimensions in the system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  // any previous impact
  previousImpact: ?DragImpact,
  // the current viewport
  viewport: Viewport,
|}

export default ({
  isMovingForward,
  pageBorderBoxCenter,
  draggableId,
  droppableId,
  home,
  draggables,
  droppables,
  previousImpact,
  viewport,
}: Args): ?Result => {
  const draggable: DraggableDimension = draggables[draggableId];
  const source: DroppableDimension = droppables[droppableId];

  // not considering the container scroll changes as container scrolling cancels a keyboard drag

  const destination: ?DroppableDimension = getBestCrossAxisDroppable({
    isMovingForward,
    pageBorderBoxCenter,
    source,
    droppables,
    viewport,
  });

  // nothing available to move to
  if (!destination) {
    return null;
  }

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination, draggables
  );

  const target: ?DraggableDimension = getClosestDraggable({
    axis: destination.axis,
    pageBorderBoxCenter,
    destination,
    insideDestination,
    viewport,
  });

  // Draggables available, but none are candidates for movement (eg none are visible)
  // Cannot move into the list
  if (insideDestination.length && !target) {
    return null;
  }

  return moveToNewDroppable({
    pageBorderBoxCenter,
    destination,
    draggable,
    target,
    insideDestination,
    home,
    previousImpact: previousImpact || noImpact,
    viewport,
  });
};
