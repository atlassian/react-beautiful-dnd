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

type Subscriber = () => void;
type Unsubscribe = () => void;

export default function createRegistry(): Registry {
  const entries: EntryMap = {
    draggables: {},
    droppables: {},
  };

  const subscribers: Subscriber[] = [];

  function subscribe(cb: Subscriber): Unsubscribe {
    subscribers.push(cb);

    return function unsubscribe(): void {
      const index: number = subscribers.indexOf(cb);

      // might have been removed by a clean
      if (index === -1) {
        return;
      }
      subscribers.splice(index, 1);
    };
  }

  function notify() {
    subscribers.forEach(cb => cb());
  }

  function findDraggableById(id: DraggableId): ?DraggableEntry {
    return entries.draggables[id] || null;
  }

  function getDraggableById(id: DraggableId): DraggableEntry {
    const entry: ?DraggableEntry = findDraggableById(id);
    invariant(entry, `Cannot find entry with id [${id}]`);
    return entry;
  }

  const draggableAPI: DraggableAPI = {
    register: (entry: DraggableEntry) => {
      entries.draggables[entry.descriptor.id] = entry;
      notify();
    },
    unregister: (entry: DraggableEntry) => {
      const current: DraggableEntry = getDraggableById(entry.descriptor.id);

      // already changed
      if (entry.uniqueId !== current.uniqueId) {
        return;
      }

      delete entries.draggables[entry.descriptor.id];
      notify();
    },
    getById: getDraggableById,
    findById: findDraggableById,
    exists: (id: DraggableId): boolean => Boolean(findDraggableById(id)),
    getAll: (): DraggableEntry[] => values(entries.draggables),
  };

  function findDroppableById(id: DroppableId): ?DroppableEntry {
    return entries.droppables[id] || null;
  }

  function getDroppableById(id: DroppableId): DroppableEntry {
    const entry: ?DroppableEntry = findDroppableById(id);
    invariant(entry, `Cannot find entry with id [${id}]`);
    return entry;
  }

  const droppableAPI: DroppableAPI = {
    register: (entry: DroppableEntry) => {
      entries.droppables[entry.descriptor.id] = entry;
    },
    unregister: (entry: DroppableEntry) => {
      const current: DroppableEntry = getDroppableById(entry.descriptor.id);

      // already changed
      if (entry.uniqueId !== current.uniqueId) {
        return;
      }

      delete entries.droppables[entry.descriptor.id];
    },
    getById: getDroppableById,
    findById: findDroppableById,
    exists: (id: DroppableId): boolean => Boolean(findDroppableById(id)),
    getAll: (): DroppableEntry[] => values(entries.droppables),
  };

  function clean(): void {
    // kill entries
    Object.keys((key: string) => {
      entries[key] = {};
    });
    // remove all subscribers
    subscribers.length = 0;
  }

  return {
    draggable: draggableAPI,
    droppable: droppableAPI,
    subscribe,
    clean,
  };
}
