// @flow
import type { Position } from 'css-box-model';
import type {
  DraggableId,
  DroppableId,
  Publish,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../types';
import type { Collection, Entries } from './dimension-marshal-types';
import * as timings from '../../debug/timings';

export type Publisher = {|
  addDraggable: (id: DraggableId) => void,
  addDroppable: (id: DroppableId) => void,
  removeDraggable: (id: DraggableId) => void,
  removeDroppable: (id: DroppableId) => void,
  stop: () => void,
|}

type DraggableMap = {
  [id: DraggableId]: true,
}

type DroppableMap = {
  [id: DroppableId]: true,
}

type Map = {|
  draggables: DraggableMap,
  droppables: DroppableMap,
|}

export type Provided = {|
  entries: Entries,
  collection: Collection
|}

type Callbacks = {|
  publish: (args: Publish) => void,
  collectionStarting: () => void,
|}

type Args = {|
  getProvided: () => Provided,
  callbacks: Callbacks
|}

const getEmptyMap = (): Map => ({
  draggables: {},
  droppables: {},
});

const timingKey: string = 'Publish collection from DOM';

export default ({
  getProvided,
  callbacks,
}: Args): Publisher => {
  let additions: Map = getEmptyMap();
  let removals: Map = getEmptyMap();
  let frameId: ?AnimationFrameID = null;

  const reset = () => {
    additions = getEmptyMap();
    removals = getEmptyMap();
  };

  const collect = () => {
    if (frameId) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      callbacks.collectionStarting();
      timings.start(timingKey);

      const { entries, collection } = getProvided();
      const windowScroll: Position = collection.initialWindowScroll;

      const draggables: DraggableDimensionMap = Object.keys(additions.draggables)
        .map((id: DraggableId): DraggableDimension =>
          // TODO
          entries.draggables[id].getDimension(windowScroll, { x: 0, y: 0 })
        )
        .reduce((previous, current) => {
          previous[current.descriptor.id] = current;
          return previous;
        }, {});

      const droppables: DroppableDimensionMap = Object.keys(additions.droppables)
        .map((id: DroppableId): DroppableDimension =>
          entries.droppables[id].callbacks.getDimensionAndWatchScroll(
            // TODO: need to figure out diff from start?
            windowScroll,
            collection.scrollOptions
          )
        )
        .reduce((previous, current) => {
          previous[current.descriptor.id] = current;
          return previous;
        }, {});

      const result: Publish = {
        additions: { draggables, droppables },
        removals: {
          draggables: Object.keys(removals.draggables),
          droppables: Object.keys(removals.droppables),
        },
      };

      reset();

      timings.finish(timingKey);
      callbacks.publish(result);
    });
  };

  const addDraggable = (id: DraggableId) => {
    additions.draggables[id] = true;

    if (removals.draggables[id]) {
      delete removals.draggables[id];
    }
    collect();
  };

  const removeDraggable = (id: DraggableId) => {
    removals.draggables[id] = true;

    if (additions.draggables[id]) {
      delete additions.draggables[id];
    }
    collect();
  };

  const addDroppable = (id: DroppableId) => {
    additions.droppables[id] = true;

    if (removals.droppables[id]) {
      delete removals.droppables[id];
    }
    collect();
  };

  const removeDroppable = (id: DroppableId) => {
    removals.droppables[id] = true;

    if (additions.droppables[id]) {
      delete additions.droppables[id];
    }
    collect();
  };

  const stop = () => {
    if (!frameId) {
      return;
    }

    cancelAnimationFrame(frameId);
    frameId = null;
    reset();
  };

  return {
    addDraggable,
    removeDraggable,
    addDroppable,
    removeDroppable,
    stop,
  };
};
