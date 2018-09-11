// @flow
import type { DroppableId, DragImpact } from '../../types';

export default (impact: DragImpact): ?DroppableId => {
  const { merge, destination } = impact;

  if (destination) {
    return destination.droppableId;
  }

  if (merge) {
    return merge.combine.droppableId;
  }

  return null;
};
