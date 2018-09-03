// @flow
import type { DroppableId, DragImpact } from '../../types';

export default (impact: DragImpact): ?DroppableId => {
  const { combine, destination } = impact;

  if (destination) {
    return destination.droppableId;
  }

  if (combine) {
    return combine.combineWith.droppableId;
  }

  return null;
};
