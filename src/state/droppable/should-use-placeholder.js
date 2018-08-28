// @flow
import type { DroppableId, DraggableDescriptor, DragImpact } from '../types';
import isDraggingOver from './is-dragging-over';

export default (
  droppableId: DroppableId,
  draggable: DraggableDescriptor,
  impact: DragImpact,
): boolean => {
  const isHomeList: boolean = droppableId === draggable.droppableId;

  // No droppable placeholder in home list
  if (isHomeList) {
    return false;
  }

  return isDraggingOver(droppableId, impact);
};
