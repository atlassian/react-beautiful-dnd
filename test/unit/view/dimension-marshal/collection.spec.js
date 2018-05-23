// @flow
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import { getPreset, getDraggableDimension, getDroppableDimension } from '../../../utils/dimension';
import type {
  Callbacks,
  DimensionMarshal,
  DroppableCallbacks,
  StartPublishingResult,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import getViewport from '../../../../src/view/window/get-viewport';
import type {
  LiftRequest,
  DimensionMap,
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  Viewport,
} from '../../../../src/types';

const preset = getPreset();

const getCallbacksStub = (): Callbacks => ({
  bulkReplace: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  bulkCollectionStarting: jest.fn(),
});

const defaultRequest: LiftRequest = {
  draggableId: preset.inHome1.descriptor.id,
  scrollOptions: {
    shouldPublishImmediately: false,
  },
};

type DimensionWatcher = {|
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

const copy = (dimensions: DimensionMap): DimensionMap => ({
  droppables: {
    ...dimensions.droppables,
  },
  draggables: {
    ...dimensions.draggables,
  },
});

const resetWatcher = (watcher: DimensionWatcher) => {
  watcher.draggable.getDimension.mockReset();
  Object.keys(watcher.droppable).forEach((key: string) => {
    watcher.droppable[key].mockReset();
  });
};

const populateMarshal = (
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
      scroll: () => {
        watcher.droppable.scroll(id);
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

describe('start publishing', () => {
  describe('critical collection', () => {
    it('should immediately publish the critical dimensions', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      const result: StartPublishingResult =
        marshal.startPublishing(defaultRequest, preset.windowScroll);
      const expected: StartPublishingResult = {
        critical: {
          droppable: preset.home.descriptor,
          draggable: preset.inHome1.descriptor,
        },
        dimensions: {
          draggables: {
            [preset.inHome1.descriptor.id]: preset.inHome1,
          },
          droppables: {
            [preset.home.descriptor.id]: preset.home,
          },
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('unable to collect critical', () => {
    it('should throw if trying to double collect critical dimensions', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      const start = () => marshal.startPublishing(defaultRequest, preset.windowScroll);

      start();
      expect(start).toThrow('Cannot start capturing critical dimensions as there is already a collection');
    });

    it('should throw if no critical draggable is found', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const dimensions: DimensionMap = copy(preset.dimensions);
      delete dimensions.draggables[preset.inHome1.descriptor.id];
      populateMarshal(marshal, dimensions);

      expect(() => marshal.startPublishing(defaultRequest, preset.windowScroll)).toThrow('Cannot find critical draggable entry');
    });

    it('should throw if no critical droppable is found', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const dimensions: DimensionMap = copy(preset.dimensions);
      delete dimensions.droppables[preset.home.descriptor.id];
      populateMarshal(marshal, dimensions);

      expect(() => marshal.startPublishing(defaultRequest, preset.windowScroll)).toThrow('Invariant failed: Cannot find critical droppable entry');
    });
  });
});

describe('collect', () => {
  describe('before collecting', () => {
    it('should throw if trying to collect before critical dimensions are collected', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      expect(() => marshal.collect({ includeCritical: false }))
        .toThrow('Cannot collect all dimensions before critical dimensions are collected');
    });

    it('should print an advanced usage warning if including the critical dimensions', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => { });
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      marshal.collect({ includeCritical: true });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Advanced usage warning'));
      console.warn.mockRestore();
    });

    it('should only print an advanced usage warning once', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => { });
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      marshal.collect({ includeCritical: true });
      marshal.collect({ includeCritical: true });
      marshal.collect({ includeCritical: true });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Advanced usage warning'));
      expect(console.warn).toHaveBeenCalledTimes(1);
      console.warn.mockRestore();
    });

    it('should let the system know a bulk collection is starting', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => { });
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      marshal.collect({ includeCritical: false });

      expect(callbacks.bulkCollectionStarting).toHaveBeenCalled();
    });
  });

  describe('collecting from the DOM', () => {
    it('should request all dimensions that are not the critical dimensions', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const watcher: DimensionWatcher = populateMarshal(marshal);
      const withoutCritical: DimensionMap = copy(preset.dimensions);
      delete withoutCritical.draggables[preset.inHome1.descriptor.id];
      delete withoutCritical.droppables[preset.home.descriptor.id];

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      // watcher has been called with critical dimensions
      resetWatcher(watcher);
      marshal.collect({ includeCritical: false });

      // need to wait an animation frame
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      requestAnimationFrame.step();

      // first frame - collect
      Object.keys(withoutCritical.droppables).forEach((id: DroppableId) => {
        expect(watcher.droppable.getDimensionAndWatchScroll).toHaveBeenCalledWith(id);
      });
      Object.keys(withoutCritical.draggables).forEach((id: DroppableId) => {
        expect(watcher.draggable.getDimension).toHaveBeenCalledWith(id);
      });
      // critical dimensions not collected
      expect(watcher.draggable.getDimension)
        .not.toHaveBeenCalledWith(preset.inHome1.descriptor.id);
      expect(watcher.droppable.getDimensionAndWatchScroll)
        .not.toHaveBeenCalledWith(preset.home.descriptor.id);

      // dimensions not collected yet
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // releasing collection frame
      requestAnimationFrame.step();

      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: withoutCritical,
        viewport: getViewport(),
        critical: null,
      });
    });

    it('should request the critical dimensions if instructed to', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const watcher: DimensionWatcher = populateMarshal(marshal);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      // watcher has been called with critical dimensions
      resetWatcher(watcher);
      marshal.collect({ includeCritical: true });

      // need to wait an animation frame
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      requestAnimationFrame.step();

      // first frame - collect
      Object.keys(preset.dimensions.droppables).forEach((id: DroppableId) => {
        expect(watcher.droppable.getDimensionAndWatchScroll).toHaveBeenCalledWith(id);
      });
      Object.keys(preset.dimensions.draggables).forEach((id: DroppableId) => {
        expect(watcher.draggable.getDimension).toHaveBeenCalledWith(id);
      });

      // dimensions not collected yet
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // releasing collection frame
      requestAnimationFrame.step();

      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: preset.dimensions,
        viewport: getViewport(),
        critical: {
          draggable: preset.inHome1.descriptor,
          droppable: preset.home.descriptor,
        },
      });
    });

    it('should only request draggables and droppables of the same type as the critical', () => {
      const foreignWithNewType: DroppableDimension = {
        ...preset.foreign,
        descriptor: {
          ...preset.foreign.descriptor,
          type: 'some cool new type',
        },
      };
      const droppables: DroppableDimensionMap = {
        ...preset.droppables,
        [foreignWithNewType.descriptor.id]: foreignWithNewType,
      };
      const dimensions: DimensionMap = {
        draggables: preset.draggables,
        droppables,
      };

      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const watcher: DimensionWatcher = populateMarshal(marshal, dimensions);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      // watcher has been called with critical dimensions
      resetWatcher(watcher);
      marshal.collect({ includeCritical: false });

      // need to wait an animation frame
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      requestAnimationFrame.step();

      // first frame - collect
      Object.keys(dimensions.droppables).forEach((id: DroppableId) => {
        const droppable: DroppableDimension = dimensions.droppables[id];

        if (droppable.descriptor.id === preset.home.descriptor.id) {
          expect(watcher.droppable.getDimensionAndWatchScroll).not.toHaveBeenCalledWith(id);
          return;
        }

        if (droppable.descriptor.id === foreignWithNewType.descriptor.id) {
          expect(watcher.droppable.getDimensionAndWatchScroll).not.toHaveBeenCalledWith(id);
          return;
        }
        expect(watcher.droppable.getDimensionAndWatchScroll).toHaveBeenCalledWith(id);
      });
      Object.keys(dimensions.draggables).forEach((id: DroppableId) => {
        const draggable: DraggableDimension = dimensions.draggables[id];
        const home: DroppableDimension = dimensions.droppables[draggable.descriptor.droppableId];

        if (draggable.descriptor.id === preset.inHome1.descriptor.id) {
          expect(watcher.draggable.getDimension).not.toHaveBeenCalledWith(id);
          return;
        }

        if (home.descriptor.id === foreignWithNewType.descriptor.id) {
          expect(watcher.draggable.getDimension).not.toHaveBeenCalledWith(id);
          return;
        }

        expect(watcher.draggable.getDimension).toHaveBeenCalledWith(id);
      });

      // dimensions not collected yet
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // releasing collection frame
      requestAnimationFrame.step();

      const expected: DimensionMap = (() => {
        // removing foriegn with new type
        const withoutForeign: DroppableDimensionMap = {
          ...dimensions.droppables,
        };
        delete withoutForeign[foreignWithNewType.descriptor.id];
        // removing critical
        delete withoutForeign[preset.home.descriptor.id];

        const draggables: DraggableDimensionMap = Object.keys(dimensions.draggables)
          .map((id: DraggableId): DraggableDimension => dimensions.draggables[id])
          // stripping out critical
          .filter((draggable: DraggableDimension): boolean =>
            draggable.descriptor.id !== preset.inHome1.descriptor.id)
          // stripping out dimensions that are not of the same type.
          .filter((draggable: DraggableDimension): boolean => {
            const home: DroppableDimension =
              dimensions.droppables[draggable.descriptor.droppableId];

            return home.descriptor.type !== foreignWithNewType.descriptor.type;
          })
          .reduce((previous: DraggableDimensionMap, current: DraggableDimension) => {
            previous[current.descriptor.id] = current;
            return previous;
          }, {});

        return {
          droppables: withoutForeign,
          draggables,
        };
      })();

      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: expected,
        viewport: getViewport(),
        critical: null,
      });
    });
  });

  describe('new collection requests during a request', () => {
    it('should cancel any pending collection', () => {

    });

    it('should cancel any pending publish', () => {

    });
  });
});

describe('stopping', () => {
  it('should cancel any pending collection', () => {

  });

  it('should cancel any pending publish', () => {

  });
});

describe('subsequent collections', () => {
  it('should allow subsequent collections during the same drag', () => {

  });

  it('should allow subsequent collections due to subsequent drags', () => {

  });
});
