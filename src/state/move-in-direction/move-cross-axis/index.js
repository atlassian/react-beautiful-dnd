// @flow
import { type Position } from 'css-box-model';
import type { PublicResult } from '../move-in-direction-types';
import type {
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
  Viewport,
} from '../../../types';
import getBestCrossAxisDroppable from './get-best-cross-axis-droppable';
import getClosestDraggable from './get-closest-draggable';
import moveToNewDroppable from './move-to-new-droppable';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import getClientFromPageBorderBoxCenter from '../../get-center-from-impact/get-client-border-box-center/get-client-from-page-border-box-center';
import getPageBorderBoxCenter from '../../get-center-from-impact/get-page-border-box-center';

type Args = {|
  isMovingForward: boolean,
  // the current page center of the dragging item
  previousPageBorderBoxCenter: Position,
  // the dragging item
  draggable: DraggableDimension,
  // the droppable the dragging item is in
  isOver: DroppableDimension,
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
  draggable,
  isOver,
  draggables,
  droppables,
  previousImpact,
  viewport,
}: Args): ?PublicResult => {
  // not considering the container scroll changes as container scrolling cancels a keyboard drag

  const destination: ?DroppableDimension = getBestCrossAxisDroppable({
    isMovingForward,
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    source: isOver,
    droppables,
    viewport,
  });

  // nothing available to move to
  if (!destination) {
    return null;
  }

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination.descriptor.id,
    draggables,
  );

  const moveRelativeTo: ?DraggableDimension = getClosestDraggable({
    axis: destination.axis,
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    viewport,
    destination,
    insideDestination,
  });

  const impact: ?DragImpact = moveToNewDroppable({
    previousPageBorderBoxCenter,
    destination,
    draggable,
    draggables,
    moveRelativeTo,
    insideDestination,
    previousImpact,
    viewport,
  });

  if (!impact) {
    return null;
  }

  const pageBorderBoxCenter: Position = getPageBorderBoxCenter({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  const clientSelection: Position = getClientFromPageBorderBoxCenter({
    pageBorderBoxCenter,
    draggable,
    viewport,
  });

  return {
    clientSelection,
    impact,
    scrollJumpRequest: null,
  };
};
