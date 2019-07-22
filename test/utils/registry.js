// @flow
import type { Position } from 'css-box-model';
import type {
  Id,
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DimensionMap,
  DraggableOptions,
} from '../../src/types';
import type {
  DroppableCallbacks,
  RecollectDroppableOptions,
  Registry,
  DraggableEntry,
  DroppableEntry,
} from '../../src/state/registry/registry-types';
import { noop } from '../../src/empty';
import { getPreset } from './dimension';

type DraggableArgs = {
  uniqueId: Id,
  dimension: DraggableDimension,
};

const defaultOptions: DraggableOptions = {
  canDragInteractiveElements: true,
  shouldRespectForcePress: false,
  isEnabled: true,
};

export function getDraggableEntry({
  uniqueId,
  dimension,
}: DraggableArgs): DraggableEntry {
  return {
    uniqueId,
    descriptor: dimension.descriptor,
    options: defaultOptions,
    getDimension: () => dimension,
  };
}

type DroppableArgs = {|
  uniqueId: Id,
  dimension: DroppableDimension,
|};

export function getDroppableEntry({
  uniqueId,
  dimension,
}: DroppableArgs): DroppableEntry {
  return {
    uniqueId,
    descriptor: dimension.descriptor,
    callbacks: {
      getDimensionAndWatchScroll: () => dimension,
      recollect: () => dimension,
      scroll: noop,
      dragStopped: noop,
    },
  };
}

export const getDroppableCallbacks = (
  dimension: DroppableDimension,
): DroppableCallbacks => ({
  getDimensionAndWatchScroll: jest.fn().mockReturnValue(dimension),
  recollect: jest.fn().mockReturnValue(dimension),
  scroll: jest.fn(),
  dragStopped: jest.fn(),
});

export type DimensionWatcher = {|
  draggable: {|
    getDimension: Function,
  |},
  droppable: {|
    getDimensionAndWatchScroll: Function,
    scroll: Function,
    recollect: Function,
    dragStopped: Function,
  |},
|};

const preset = getPreset();

export const populate = (
  registry: Registry,
  dimensions?: DimensionMap = preset.dimensions,
): DimensionWatcher => {
  const { draggables, droppables } = dimensions;
  const watcher: DimensionWatcher = {
    draggable: {
      getDimension: jest.fn(),
    },
    droppable: {
      getDimensionAndWatchScroll: jest.fn(),
      scroll: jest.fn(),
      recollect: jest.fn(),
      dragStopped: jest.fn(),
    },
  };

  Object.keys(droppables).forEach((id: DroppableId) => {
    const droppable: DroppableDimension = droppables[id];
    const callbacks: DroppableCallbacks = {
      getDimensionAndWatchScroll: () => {
        watcher.droppable.getDimensionAndWatchScroll(id);
        return droppable;
      },
      scroll: (change: Position) => {
        watcher.droppable.scroll(id, change);
      },
      recollect: (options: RecollectDroppableOptions) => {
        watcher.droppable.recollect(id, options);
        return droppable;
      },
      dragStopped: () => {
        watcher.droppable.dragStopped(id);
      },
    };

    const entry: DroppableEntry = {
      uniqueId: droppable.descriptor.id,
      descriptor: droppable.descriptor,
      callbacks,
    };

    registry.droppable.register(entry);
  });

  Object.keys(draggables).forEach((id: DraggableId) => {
    const draggable: DraggableDimension = draggables[id];
    const getDimension = (): DraggableDimension => {
      watcher.draggable.getDimension(id);
      return draggable;
    };

    const entry: DraggableEntry = {
      uniqueId: draggable.descriptor.id,
      descriptor: draggable.descriptor,
      options: defaultOptions,
      getDimension,
    };

    registry.draggable.register(entry);
  });

  return watcher;
};

export const resetWatcher = (watcher: DimensionWatcher) => {
  watcher.draggable.getDimension.mockReset();
  Object.keys(watcher.droppable).forEach((key: string) => {
    watcher.droppable[key].mockReset();
  });
};
