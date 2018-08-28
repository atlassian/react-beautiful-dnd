// @flow
import type { DroppableId, DragImpact } from '../../types';

export default (impact: DragImpact): ?DroppableId => {
  const { group, destination } = impact;

  if (destination) {
    return destination.droppableId;
  }

  if (group) {
    return group.groupingWith.droppableId;
  }

  return null;
};
