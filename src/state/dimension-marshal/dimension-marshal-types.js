// @flow
import type { Position } from 'css-box-model';
import type {
  UpdateDroppableScrollArgs,
  UpdateDroppableIsEnabledArgs,
  UpdateDroppableIsCombineEnabledArgs,
} from '../action-creators';
import type {
  DraggableDescriptor,
  DroppableDescriptor,
  DraggableDimension,
  DroppableDimension,
  DraggableId,
  DroppableId,
  ScrollOptions,
  Critical,
  DimensionMap,
  LiftRequest,
  Published,
  Viewport,
} from '../../types';

export type GetDraggableDimensionFn = (
  windowScroll: Position,
) => DraggableDimension;

export type GetDroppableDimensionFn = (
  windowScroll: Position,
  options: ScrollOptions,
) => DroppableDimension;

export type DroppableCallbacks = {|
  // a drag is starting
  getDimensionAndWatchScroll: GetDroppableDimensionFn,
  recollect: () => DroppableDimension,
  // scroll a droppable
  scroll: (change: Position) => void,
  // If the Droppable is listening for scroll events - it needs to stop!
  // Can be called on droppables that have not been asked to watch scroll
  dragStopped: () => void,
|};

export type DroppableEntry = {|
  descriptor: DroppableDescriptor,
  callbacks: DroppableCallbacks,
|};

export type DraggableEntry = {|
  descriptor: DraggableDescriptor,
  getDimension: GetDraggableDimensionFn,
|};

export type DraggableEntryMap = {
  [key: DraggableId]: DraggableEntry,
};

export type DroppableEntryMap = {
  [key: DroppableId]: DroppableEntry,
};

export type Entries = {|
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
|};

export type StartPublishingResult = {|
  critical: Critical,
  dimensions: DimensionMap,
  viewport: Viewport,
|};

export type DimensionMarshal = {|
  // Draggable
  registerDraggable: (
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn,
  ) => void,
  updateDraggable: (
    previous: DraggableDescriptor,
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn,
  ) => void,
  unregisterDraggable: (descriptor: DraggableDescriptor) => void,
  // Droppable
  registerDroppable: (
    descriptor: DroppableDescriptor,
    callbacks: DroppableCallbacks,
  ) => void,
  updateDroppable: (
    previous: DroppableDescriptor,
    descriptor: DroppableDescriptor,
    callbacks: DroppableCallbacks,
  ) => void,
  // it is possible for a droppable to change whether it is enabled during a drag
  updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
  // it is also possible to update whether combining is enabled
  updateDroppableIsCombineEnabled: (
    id: DroppableId,
    isEnabled: boolean,
  ) => void,
  updateDroppableScroll: (id: DroppableId, newScroll: Position) => void,
  scrollDroppable: (id: DroppableId, change: Position) => void,
  unregisterDroppable: (descriptor: DroppableDescriptor) => void,
  // Entry
  startPublishing: (request: LiftRequest) => StartPublishingResult,
  stopPublishing: () => void,
|};

export type Callbacks = {|
  collectionStarting: () => mixed,
  publishWhileDragging: (args: Published) => mixed,
  updateDroppableScroll: (args: UpdateDroppableScrollArgs) => mixed,
  updateDroppableIsEnabled: (args: UpdateDroppableIsEnabledArgs) => mixed,
  updateDroppableIsCombineEnabled: (
    args: UpdateDroppableIsCombineEnabledArgs,
  ) => mixed,
|};
