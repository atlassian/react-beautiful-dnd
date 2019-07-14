// @flow
import type {
  Id,
  DraggableId,
  DraggableDescriptor,
  DraggableOptions,
  DraggableDimension,
  DroppableId,
} from '../../types';

export type DraggableEntry = {|
  uniqueId: Id,
  descriptor: DraggableDescriptor,
  options: DraggableOptions,
  getDimension: () => DraggableDimension,
|};

export type DraggableAPI = {|
  register: (entry: DraggableEntry) => void,
  unregister: (uniqueId: Id, id: DraggableId) => void,
  getById: (id: DraggableId) => DraggableEntry,
  getAll: () => DraggableEntry[],
|};

export type DroppableEvent = 'IS_ENABLED_CHANGE' | 'IS_COMBINED_CHANGE';

export type DroppableEntry = {|
  uniqueId: Id,
  descriptor: DraggableDescriptor,
  options: DraggableOptions,
  getDimension: () => DraggableDimension,
|};

export type DroppableHandler = (entry: DroppableEntry) => void;

export type DroppableAPI = {|
  register: (entry: DroppableEntry) => void,
  unregister: (uniqueId: Id, id: DroppableId) => void,
  getById: (id: DroppableId) => DroppableEntry,
  getAll: () => DroppableEntry[],
  // returns an unsubscribe function
  addListener: (type: DroppableEvent, handler: DroppableHandler) => () => void,
|};

export type Registry = {|
  draggable: DraggableAPI,
  droppable: DroppableAPI,
  clean: () => void,
|};
