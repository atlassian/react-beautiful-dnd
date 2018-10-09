// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimension,
  DraggableId,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
} from '../../../types';
import type { InternalResult } from '../move-in-direction-types';
import moveToNextIndex from './move-to-next-index';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import moveToNextCombine from './move-to-next-combine';
import isHomeOf from '../../droppable/is-home-of';

type Args = {|
  isMovingForward: boolean,
  draggableId: DraggableId,
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Viewport,
  previousImpact: DragImpact,
  previousPageBorderBoxCenter: Position,
|};

export default ({
  isMovingForward,
  draggableId,
  destination,
  draggables,
  viewport,
  previousImpact,
  previousPageBorderBoxCenter,
}: Args): ?InternalResult => {
  if (!destination.isEnabled) {
    return null;
  }

  const draggable: DraggableDimension = draggables[draggableId];
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );
  const isInHomeList: boolean = isHomeOf(draggable, destination);

  return (
    moveToNextCombine({
      isInHomeList,
      isMovingForward,
      draggable,
      draggables,
      destination,
      insideDestination,
      previousImpact,
      viewport,
    }) ||
    moveToNextIndex({
      isMovingForward,
      isInHomeList,
      draggable,
      draggables,
      destination,
      insideDestination,
      previousPageBorderBoxCenter,
      previousImpact,
      viewport,
    })
  );
};
