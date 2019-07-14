// @flow
import invariant from 'tiny-invariant';
import type { Id, DraggableId, DroppableId } from '../../types';
import type {
  Registry,
  DraggableAPI,
  DroppableAPI,
  DroppableEvent,
  DraggableEntry,
  DroppableEntry,
  DroppableHandler,
} from './registry-types';
import { values } from '../../native-with-fallback';

type DraggableEntryMap = {
  [id: DraggableId]: DraggableEntry,
};

type DroppableEntryMap = {
  [id: DroppableId]: DroppableEntry,
};

type EntryMap = {
  draggables: DraggableEntryMap,
  droppables: DroppableEntryMap,
};

export default function createRegistry(): Registry {
  const entries: EntryMap = {
    draggables: {},
    droppables: {},
  };

  function getDraggableById(id: DraggableId): DraggableEntry {
    const entry: ?DraggableEntry = entries.draggables[id];
    invariant(entry, `Cannot find entry with id [${id}]`);
    return entry;
  }

  const draggableAPI: DraggableAPI = {
    register: (entry: DraggableEntry) => {
      entries.draggables[entry.descriptor.id] = entry;
    },
    unregister: (uniqueId: Id, id: DraggableId) => {
      const entry: DraggableEntry = getDraggableById(id);

      // already changed
      if (entry.uniqueId !== uniqueId) {
        return;
      }
      delete entries.draggables[id];
    },
    getById: getDraggableById,
    getAll: (): DraggableEntry[] => values(entries.draggables),
  };

  function getDroppableById(id: DroppableId): DroppableEntry {
    const entry: ?DroppableEntry = entries.droppables[id];
    invariant(entry, `Cannot find entry with id [${id}]`);
    return entry;
  }

  const listeners: DroppableHandler[] = [];

  const droppableAPI: DroppableAPI = {
    register: (entry: DroppableEntry) => {
      entries.droppables[entry.descriptor.id] = entry;
    },
    unregister: (uniqueId: Id, id: DroppableId) => {
      const entry: DroppableEntry = getDroppableById(id);

      // already changed
      if (entry.uniqueId !== uniqueId) {
        return;
      }
      delete entries.droppables[id];
    },
    getById: getDroppableById,
    getAll: (): DroppableEntry[] => values(entries.droppables),
    addListener: (type: DroppableEvent, handler: DroppableHandler) => {
      listeners.push(handler);

      return function unsubscribe() {
        // in place delete
        const index: number = listeners.indexOf(handler);
        invariant(index !== -1, 'Unable to unsubscribe');
        listeners.splice(index, 1);
      };
    },
  };

  function clean(): void {
    Object.keys((key: string) => {
      entries[key] = {};
    });
    // unsubscribe all listeners
    listeners.length = 0;
  }

  return {
    draggable: draggableAPI,
    droppable: droppableAPI,
    clean,
  };
}
