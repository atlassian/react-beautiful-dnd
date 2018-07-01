// @flow
import type { Critical, DraggableLocation } from '../types';

export default (critical: Critical): DraggableLocation => ({
  index: critical.draggable.index,
  droppableId: critical.droppable.id,
});
