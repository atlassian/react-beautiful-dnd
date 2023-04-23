// @flow
import type { DraggableDescriptor, DraggableLocation } from '../types';

export default (descriptor: DraggableDescriptor): DraggableLocation => ({
  index: descriptor.index,
  droppableId: descriptor.droppableId,
});
