// @flow
import { droppableMapToList } from './dimension-map-to-list';
import isWithinVisibleBoundsOfDroppable from './is-within-visible-bounds-of-droppable';
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
  const maybe: ?DroppableDimension = droppableMapToList(droppables)
    .find((droppable: DroppableDimension): boolean => (
      isWithinVisibleBoundsOfDroppable(target, droppable)
    ));

  return maybe ? maybe.id : null;
};
