// @flow
import type {
  DraggableDescriptor,
  DroppableDescriptor,
  DraggableDimension,
  DroppableDimension,
  DraggableId,
  DroppableId,
  State,
  Position,
} from '../../types';

export type GetDraggableDimensionFn = () => DraggableDimension;
export type GetDroppableDimensionFn = () => DroppableDimension;
export type UpdateDroppableScrollFn = (id: DroppableId, offset: Position) => void;

export type DroppableCallbacks = {|
  getDimension: GetDroppableDimensionFn,
  // Droppable must listen to scroll events and publish them using the
  // onChange callback. If the Droppable is not in a scroll container then
  // it does not need to do anything
  watchScroll: () => void,
  // If the Droppable is listening for scrol events - it needs to stop!
  // This may be called even if watchScroll was not previously called
  unwatchScroll: () => void,
|}

export type DroppableEntry = {|
  descriptor: DroppableDescriptor,
  callbacks: DroppableCallbacks
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

export type DimensionMarshal = {|
  // Draggable
  registerDraggable: (descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn) => void,
  unregisterDraggable: (id: DraggableId) => void,
  // Droppable
  registerDroppable: (descriptor: DroppableDescriptor,
    callbacks: DroppableCallbacks) => void,
  // it is possible for a droppable to change whether it is enabled during a drag
  updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
  updateDroppableScroll: (id: DroppableId, newScroll: Position) => void,
  unregisterDroppable: (id: DroppableId) => void,
  // Entry
  onPhaseChange: (current: State) => void,
|}

export type Callbacks = {|
  cancel: () => void,
  publishDraggables: (DraggableDimension[]) => void,
  publishDroppables: (DroppableDimension[]) => void,
  updateDroppableScroll: (id: DroppableId, newScroll: Position) => void,
  updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
|}
