// @flow
import type {
  DraggableDescriptor,
  DroppableDescriptor,
  DraggableDimension,
  DroppableDimension,
  DraggableId,
  State,
  DroppableId,
} from '../../types';

export type GetDraggableDimensionFn = () => DraggableDimension;
export type GetDroppableDimensionFn = () => DroppableDimension;

export type Marshal = {|
  registerDraggable: (descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn) => void,
  registerDroppable: (descriptor: DroppableDescriptor,
    getDimension: GetDroppableDimensionFn) => void,
  unregisterDraggable: (id: DraggableId) => void,
  unregisterDroppable: (id: DroppableId) => void,
  onStateChange: (current: State, previous: State) => void
|}

export type Callbacks = {|
  cancel: () => void,
  publishDraggables: (DraggableDimension[]) => void,
  publishDroppables: (DroppableDimension[]) => void,
|}
