// @flow
import { isPointWithin } from './is-within-visible-bounds-of-droppable';
import type {
  DroppableId,
  Position,
  DroppableDimensionMap,
  DroppableDimension,
} from '../types';

export default (
  target: Position,
  droppables: DroppableDimensionMap,
): ?DroppableId => {
  const maybe: ?DroppableDimension =
    Object.keys(droppables)
      .map((id: DroppableId): DroppableDimension => droppables[id])
      .find((droppable: DroppableDimension): boolean => (
        isPointWithin(droppable)(target)
      ));

  return maybe ? maybe.id : null;
};
