// @flow
import { type Position } from 'css-box-model';
import getBestCrossAxisDroppable from './get-best-cross-axis-droppable';
import getClosestDraggable from './get-closest-draggable';
import moveToNewDroppable from './move-to-new-droppable';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import type { InternalResult } from '../move-in-direction-types';
import type {
  DraggableId,
  DroppableId,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
  Viewport,
} from '../../../types';

type Args = {|
  isMovingForward: boolean,
  // the current page center of the dragging item
  previousPageBorderBoxCenter: Position,
  // the dragging item
  draggableId: DraggableId,
  // the droppable the dragging item is in
  droppableId: DroppableId,
  // all the dimensions in the system
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  // any previous impact
  previousImpact: DragImpact,
  // the current viewport
  viewport: Viewport,
|};

export default ({
  isMovingForward,
  previousPageBorderBoxCenter,
  draggableId,
  droppableId,
  draggables,
  droppables,
  previousImpact,
  viewport,
}: Args): ?InternalResult => {
  const draggable: DraggableDimension = draggables[draggableId];
  const source: DroppableDimension = droppables[droppableId];

  // not considering the container scroll changes as container scrolling cancels a keyboard drag

  const destination: ?DroppableDimension = getBestCrossAxisDroppable({
    isMovingForward,
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    source,
    droppables,
    viewport,
  });

  // nothing available to move to
  if (!destination) {
    return null;
  }

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );

  const moveRelativeTo: ?DraggableDimension = getClosestDraggable({
    axis: destination.axis,
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    destination,
    insideDestination,
    viewport,
  });

  return moveToNewDroppable({
    previousPageBorderBoxCenter,
    destination,
    draggable,
    draggables,
    moveRelativeTo,
    insideDestination,
    previousImpact,
    viewport,
  });
};
