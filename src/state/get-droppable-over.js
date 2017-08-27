// @flow
import { droppableMapToList } from './dimension-map-to-list';
import type {
  DroppableId,
  Position,
  DroppableDimensionMap,
  DroppableDimension,
  DimensionFragment,
} from '../types';

const isOverDroppable = (target: Position, droppable: DroppableDimension): boolean => {
  const fragment: DimensionFragment = droppable.page.withMargin;
  const { top, right, bottom, left } = fragment;

  return target.x >= left &&
    target.x <= right &&
    target.y >= top &&
    target.y <= bottom;
};

export default (
  target: Position,
  droppables: DroppableDimensionMap,
): ?DroppableId => {
  const maybe: ?DroppableDimension = droppableMapToList(droppables)
    .find((droppable: DroppableDimension): boolean => (
      isOverDroppable(target, droppable)
    ));

  return maybe ? maybe.id : null;
};
