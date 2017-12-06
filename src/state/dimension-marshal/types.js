// @flow
import type { DraggableId, DroppableId, TypeId } from '../../types';

export type DraggableDescriptor = {|
  id: DraggableId,
  droppableId: DroppableId,
  index: number,
|}

export type DroppableDescriptor = {|
  id: DroppableId,
  type: TypeId,
  // does not need to be true index
  // just a way of expressing what things are close together
  index: number,
|}
