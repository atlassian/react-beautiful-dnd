// @flow
import memoizeOne from 'memoize-one';
import isPositionInFrame from '../visibility/is-position-in-frame';
import type {
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
} from '../../types';

type Args = {|
  target: Position,
  droppables: DroppableDimensionMap,
|};

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

export default ({
  target,
  droppables,
}: Args): ?DroppableDimension => {
  const maybe: ?DroppableDimension =
    getScrollableDroppables(droppables)
      .find((droppable: DroppableDimension): boolean => {
        if (!droppable.viewport.closestScrollable) {
          throw new Error('Invalid result');
        }
        return isPositionInFrame(droppable.viewport.closestScrollable.frame)(target);
      });

  return maybe;
};
