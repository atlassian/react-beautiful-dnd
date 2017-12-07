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

export type DroppableEntry = {|
  descriptor: DroppableDescriptor,
  getDimension: GetDroppableDimensionFn,
|}

export type DraggableEntry = {|
  descriptor: DraggableDescriptor,
  getDimension: GetDraggableDimensionFn,
|}

export type DraggableEntryMap = {
  [key: DraggableId]: DraggableEntry,
}

export type DroppableEntryMap = {
  [key: DroppableId]: DroppableEntry,
}

export type UnknownDescriptorType = DraggableDescriptor | DroppableDescriptor;
export type UnknownDimensionType = DraggableDimension | DroppableDimension;

export type OrderedCollectionList = Array<UnknownDescriptorType>;
export type OrderedDimensionList = Array<UnknownDimensionType>;

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
