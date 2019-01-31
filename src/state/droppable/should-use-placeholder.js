// @flow
import type { DraggableDescriptor, DragImpact } from '../../types';
import whatIsDraggedOver from './what-is-dragged-over';

// use placeholder if dragged over
export default (descriptor: DraggableDescriptor, impact: DragImpact): boolean =>
  whatIsDraggedOver(impact) === descriptor.droppableId;
