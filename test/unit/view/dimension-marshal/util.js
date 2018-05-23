// @flow
import { type Position } from 'css-box-model';
import { getPreset } from '../../../utils/dimension';
import type {
  DimensionMarshal,
  DroppableCallbacks,
  Callbacks,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  DimensionMap,
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';

const preset = getPreset();

export type DimensionWatcher = {|
  draggable: {|
    getDimension: Function,
  |},
  droppable: {|
    getDimensionAndWatchScroll: Function,
    scroll: Function,
    unwatchScroll: Function,
    hidePlaceholder: Function,
    showPlaceholder: Function,
  |}
|}

export const resetWatcher = (watcher: DimensionWatcher) => {
  watcher.draggable.getDimension.mockReset();
  Object.keys(watcher.droppable).forEach((key: string) => {
    watcher.droppable[key].mockReset();
  });
};

export const populateMarshal = (
  marshal: DimensionMarshal,
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
      unwatchScroll: jest.fn(),
      hidePlaceholder: jest.fn(),
      showPlaceholder: jest.fn(),
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
      unwatchScroll: () => {
        watcher.droppable.unwatchScroll(id);
      },
      hidePlaceholder: () => {
        watcher.droppable.hidePlaceholder(id);
      },
      showPlaceholder: () => {
        watcher.droppable.showPlaceholder(id);
      },
    };

    marshal.registerDroppable(droppable.descriptor, callbacks);
  });

  Object.keys(draggables).forEach((id: DraggableId) => {
    const draggable: DraggableDimension = draggables[id];
    const getDimension = (): DraggableDimension => {
      watcher.draggable.getDimension(id);
      return draggable;
    };
    marshal.registerDraggable(draggable.descriptor, getDimension);
  });

  return watcher;
};

export const getDroppableCallbacks = (dimension: DroppableDimension): DroppableCallbacks => ({
  getDimensionAndWatchScroll: jest.fn().mockReturnValue(dimension),
  scroll: jest.fn(),
  unwatchScroll: jest.fn(),
  hidePlaceholder: jest.fn(),
  showPlaceholder: jest.fn(),
});

export const withExpectedAdvancedUsageWarning = (fn: Function) => {
  jest.spyOn(console, 'warn').mockImplementation(() => { });
  fn();
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Advanced usage warning'));
  console.warn.mockRestore();
};

export const getCallbacksStub = (): Callbacks => ({
  bulkReplace: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  bulkCollectionStarting: jest.fn(),
});

