// @flow
import type { DroppableId, Position, DroppableDimensionMap } from '../types';
import isInsideDroppable from './is-inside-droppable';

export default (
  target: Position,
  droppables: DroppableDimensionMap,
): ?DroppableId => {
  const maybeId: ?DroppableId = Object.keys(droppables)
    .find(key => isInsideDroppable(target, droppables[key]));

  return maybeId || null;
};
