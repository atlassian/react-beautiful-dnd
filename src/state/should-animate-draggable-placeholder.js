// @flow
import type { DraggableDescriptor, DragImpact, DroppableId } from '../types';
import whatIsDraggedOver from './droppable/what-is-dragged-over';

export default (
  current: boolean,
  draggable: DraggableDescriptor,
  impact: DragImpact,
): boolean => {
  // once a draggable placeholder should animate - then it should animate for the rest of the drag
  if (current) {
    return current;
  }

  const isOver: ?DroppableId = whatIsDraggedOver(impact);

  if (!isOver) {
    return false;
  }

  const isOverForeign: boolean = isOver !== draggable.droppableId;

  return isOverForeign;
};
