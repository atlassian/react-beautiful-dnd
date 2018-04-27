// @flow
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import isPositionInFrame from '../visibility/is-position-in-frame';
import type {
  DroppableId,
  DroppableDimension,
  DroppableDimensionMap,
  DraggableLocation,
} from '../../types';

const getScrollableDroppables = memoizeOne(
  (droppables: DroppableDimensionMap): DroppableDimension[] => (
    Object.keys(droppables)
      .map((id: DroppableId): DroppableDimension => droppables[id])
      .filter((droppable: DroppableDimension): boolean => {
        // exclude disabled droppables
        if (!droppable.isEnabled) {
          return false;
        }

        // only want droppables that are scrollable
        if (!droppable.viewport.closestScrollable) {
          return false;
        }

        return true;
      })
  )
);

const getScrollableDroppableOver = (
  target: Position,
  droppables: DroppableDimensionMap
): ?DroppableDimension => {
  const maybe: ?DroppableDimension =
    getScrollableDroppables(droppables)
      .find((droppable: DroppableDimension): boolean => {
        invariant(droppable.viewport.closestScrollable, 'Invalid result');
        return isPositionInFrame(droppable.viewport.closestScrollable.framePageMarginBox)(target);
      });

  return maybe;
};

type Api = {|
  center: Position,
  destination: ?DraggableLocation,
  droppables: DroppableDimensionMap,
|}

export default ({
  center,
  destination,
  droppables,
}: Api): ?DroppableDimension => {
  // We need to scroll the best droppable frame we can so that the
  // placeholder buffer logic works correctly

  if (destination) {
    const dimension: DroppableDimension = droppables[destination.droppableId];
    if (!dimension.viewport.closestScrollable) {
      return null;
    }
    return dimension;
  }

  // 2. If we are not over a droppable - are we over a droppable frame?
  const dimension: ?DroppableDimension = getScrollableDroppableOver(
    center,
    droppables,
  );

  return dimension;
};
