// @flow
import type { DraggableDescriptor, DragImpact, DroppableId } from '../../types';
import whatIsDraggedOver from './what-is-dragged-over';

export default (
  descriptor: DraggableDescriptor,
  impact: DragImpact,
): boolean => {
  // use a placeholder when over a foreign list
  const isOver: ?DroppableId = whatIsDraggedOver(impact);
  if (isOver == null) {
    return false;
  }
  return isOver !== descriptor.droppableId;
};
