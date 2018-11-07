// @flow
import { type Position } from 'css-box-model';
import { bindActionCreators } from 'redux';
import createDimensionMarshal from '../../src/state/dimension-marshal/dimension-marshal';
import {
  publishWhileDragging,
  updateDroppableScroll,
  updateDroppableIsEnabled,
  updateDroppableIsCombineEnabled,
  collectionStarting,
} from '../../src/state/action-creators';
import { getPreset } from './dimension';
import type {
  DimensionMarshal,
  Callbacks,
  DroppableCallbacks,
} from '../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  DroppableDimension,
  DraggableId,
  DroppableId,
  DraggableDimension,
  DimensionMap,
} from '../../src/types';

export default (dispatch: Function): DimensionMarshal => {
  const callbacks: Callbacks = bindActionCreators(
    {
      publishWhileDragging,
      collectionStarting,
      updateDroppableScroll,
      updateDroppableIsEnabled,
      updateDroppableIsCombineEnabled,
    },
    dispatch,
  );

  const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

  return marshal;
};

const preset = getPreset();

export const getMarshalStub = (): DimensionMarshal => ({
  registerDraggable: jest.fn(),
  updateDraggable: jest.fn(),
  unregisterDraggable: jest.fn(),
  registerDroppable: jest.fn(),
  updateDroppable: jest.fn(),
  unregisterDroppable: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  updateDroppableIsCombineEnabled: jest.fn(),
  scrollDroppable: jest.fn(),
  startPublishing: jest.fn(),
  stopPublishing: jest.fn(),
});

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
      recollect: () => {
        watcher.droppable.recollect(id);
        return droppable;
      },
      dragStopped: () => {
        watcher.droppable.dragStopped(id);
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

export const getCallbacksStub = (): Callbacks => ({
  publishWhileDragging: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  updateDroppableIsCombineEnabled: jest.fn(),
  collectionStarting: jest.fn(),
});
