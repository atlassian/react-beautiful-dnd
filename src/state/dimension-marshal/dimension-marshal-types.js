// @flow
import { type Position } from 'css-box-model';
import type {
  DraggableDescriptor,
  DroppableDescriptor,
  DraggableDimension,
  DroppableDimension,
  DraggableId,
  DroppableId,
  State,
  ScrollOptions,
} from '../../types';

export type GetDraggableDimensionFn = () => DraggableDimension;
export type GetDroppableDimensionFn = (options: ScrollOptions) => DroppableDimension;

export type DroppableCallbacks = {|
  getDimensionAndWatchScroll: GetDroppableDimensionFn,
  // scroll a droppable
  scroll: (change: Position) => void,
  // If the Droppable is listening for scroll events - it needs to stop!
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

export type ToBeCollected = {|
  draggables: DraggableId[],
  droppables: DroppableId[],
|}

export type Collection = {|
  scrollOptions: ScrollOptions,
  critical: {|
    draggable: DraggableDescriptor,
    droppable: DroppableDescriptor,
  |}
|}

export type DimensionMarshal = {|
  // Draggable
  registerDraggable: (
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn
  ) => void,
  updateDraggable: (
    previous: DraggableDescriptor,
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn
  ) => void,
  unregisterDraggable: (descriptor: DraggableDescriptor) => void,
  // Droppable
  registerDroppable: (
    descriptor: DroppableDescriptor,
    callbacks: DroppableCallbacks
  ) => void,
  updateDroppable: (
    previous: DroppableDescriptor,
    descriptor: DroppableDescriptor,
    callbacks: DroppableCallbacks,
  ) => void,
  // it is possible for a droppable to change whether it is enabled during a drag
  updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
  updateDroppableScroll: (id: DroppableId, newScroll: Position) => void,
  scrollDroppable: (id: DroppableId, change: Position) => void,
  unregisterDroppable: (descriptor: DroppableDescriptor) => void,
  // Entry
  onPhaseChange: (current: State) => void,
|}

export type Callbacks = {|
  cancel: () => void,
  publishDraggable: (DraggableDimension) => void,
  publishDroppable: (DroppableDimension) => void,
  bulkPublish: (
    droppables: DroppableDimension[],
    draggables: DraggableDimension[],
  ) => void,
  updateDroppableScroll: (id: DroppableId, newScroll: Position) => void,
  updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
|}
