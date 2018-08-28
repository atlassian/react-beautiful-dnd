// @flow
import type { DroppableId, DragImpact } from '../../types';

export default (droppableId: DroppableId, impact: DragImpact): boolean => {
  // Only want placeholder for foreign lists
  const { group, destination } = impact;

  if (destination) {
    return droppableId === destination.droppableId;
  }

  if (group) {
    return droppableId === group.groupingWith.droppableId;
  }

  return false;
};
