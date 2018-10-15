// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
} from '../../../types';
import type { InternalResult } from '../move-in-direction-types';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import moveToNextCombine from './move-to-next-combine';
import moveToNextIndex from './move-to-next-index';
import isHomeOf from '../../droppable/is-home-of';

type Args = {|
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
  previousImpact: DragImpact,
  previousPageBorderBoxCenter: Position,
|};

export default ({
  isMovingForward,
  draggable,
  destination,
  draggables,
  previousImpact,
}: Args): ?InternalResult => {
  if (!destination.isEnabled) {
    return null;
  }

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination.descriptor.id,
    draggables,
  );
  const isInHomeList: boolean = isHomeOf(draggable, destination);

  const impact: ?DragImpact =
    moveToNextCombine({
      isInHomeList,
      isMovingForward,
      draggable,
      destination,
      insideDestination,
      previousImpact,
    }) ||
    moveToNextIndex({
      isMovingForward,
      isInHomeList,
      draggable,
      draggables,
      destination,
      insideDestination,
      previousImpact,
    });

  if (!impact) {
    return null;
  }

  return {
    type: 'SNAP_MOVE',
    impact,
  };
};
