// @flow
import memoizeOne from 'memoize-one';
import isPositionInFrame from '../visibility/is-position-in-frame';
import type {
  Area,
  DroppableDimension,
  DroppableDimensionMap,
  DroppableId,
  Position,
} from '../../types';

type Args = {|
  target: Position,
  droppables: DroppableDimensionMap,
|};

const getDroppablesWithAFrame = memoizeOne(
  (droppables: DroppableDimensionMap): DroppableDimension[] => (
    Object.keys(droppables)
      .map((id: DroppableId): DroppableDimension => droppables[id])
      .filter((droppable: DroppableDimension): boolean => {
        // exclude disabled droppables
        if (!droppable.isEnabled) {
          return false;
        }

        // only want droppables that have a frame
        if (!droppable.viewport.frame) {
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
  const overDroppablesFrame: ?DroppableDimension =
    getDroppablesWithAFrame(droppables)
      .find((droppable: DroppableDimension): boolean => {
        const frame: Area = (droppable.viewport.frame: any);
        return isPositionInFrame(frame)(target);
      });

  return overDroppablesFrame;
};
