// @flow
import type { Position } from 'css-box-model';
import type {
  Id,
  DraggableId,
  DraggableDescriptor,
  DraggableOptions,
  DraggableDimension,
  DroppableId,
  ScrollOptions,
  DroppableDescriptor,
  DroppableDimension,
} from '../../types';

export type GetDraggableDimensionFn = (
  windowScroll: Position,
) => DraggableDimension;

export type DraggableEntry = {|
  uniqueId: Id,
  descriptor: DraggableDescriptor,
  options: DraggableOptions,
  getDimension: GetDraggableDimensionFn,
|};

export type DraggableAPI = {|
  register: (entry: DraggableEntry) => void,
  unregister: (entry: DraggableEntry) => void,
  exists: (id: DraggableId) => boolean,
  getById: (id: DraggableId) => DraggableEntry,
  findById: (id: DraggableId) => ?DraggableEntry,
  getAll: () => DraggableEntry[],
|};

export type GetDroppableDimensionFn = (
  windowScroll: Position,
  options: ScrollOptions,
) => DroppableDimension;

export type RecollectDroppableOptions = {|
  withoutPlaceholder: boolean,
|};

export type DroppableCallbacks = {|
  // a drag is starting
  getDimensionAndWatchScroll: GetDroppableDimensionFn,
  recollect: (options: RecollectDroppableOptions) => DroppableDimension,
  // scroll a droppable
  scroll: (change: Position) => void,
  // If the Droppable is listening for scroll events - it needs to stop!
  // Can be called on droppables that have not been asked to watch scroll
  dragStopped: () => void,
|};

export type DroppableEntry = {|
  uniqueId: Id,
  descriptor: DroppableDescriptor,
  callbacks: DroppableCallbacks,
|};

export type DroppableAPI = {|
  register: (entry: DroppableEntry) => void,
  unregister: (entry: DroppableEntry) => void,
  exists: (id: DraggableId) => boolean,
  getById: (id: DroppableId) => DroppableEntry,
  findById: (id: DroppableId) => ?DroppableEntry,
  getAll: () => DroppableEntry[],
|};

export type Registry = {|
  draggable: DraggableAPI,
  droppable: DroppableAPI,
  subscribe: (cb: () => void) => () => void,
  clean: () => void,
|};
