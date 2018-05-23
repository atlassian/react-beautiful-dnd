// @flow
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import { getPreset } from '../../../utils/dimension';
import type {
  Callbacks,
  DimensionMarshal,
  StartPublishingResult,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import getViewport from '../../../../src/view/window/get-viewport';
import type {
  Critical,
  LiftRequest,
  DimensionMap,
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
} from '../../../../src/types';
import {
  populateMarshal,
  resetWatcher,
  getCallbacksStub,
  type DimensionWatcher, withExpectedAdvancedUsageWarning,
} from './util';

const preset = getPreset();

const critical: Critical = {
  droppable: preset.home.descriptor,
  draggable: preset.inHome1.descriptor,
};

const defaultRequest: LiftRequest = {
  draggableId: critical.draggable.id,
  scrollOptions: {
    shouldPublishImmediately: false,
  },
};

const startResult: StartPublishingResult = {
  critical,
  dimensions: {
    draggables: {
      [preset.inHome1.descriptor.id]: preset.inHome1,
    },
    droppables: {
      [preset.home.descriptor.id]: preset.home,
    },
  },
};

const copy = (dimensions: DimensionMap): DimensionMap => ({
  droppables: {
    ...dimensions.droppables,
  },
  draggables: {
    ...dimensions.draggables,
  },
});

const withoutCritical: DimensionMap = copy(preset.dimensions);
delete withoutCritical.draggables[critical.draggable.id];
delete withoutCritical.droppables[critical.droppable.id];

describe('start publishing', () => {
  describe('critical collection', () => {
    it('should immediately publish the critical dimensions', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      const result: StartPublishingResult =
        marshal.startPublishing(defaultRequest, preset.windowScroll);

      expect(result).toEqual(startResult);
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
      delete dimensions.draggables[critical.draggable.id];
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
        .not.toHaveBeenCalledWith(critical.draggable.id);
      expect(watcher.droppable.getDimensionAndWatchScroll)
        .not.toHaveBeenCalledWith(critical.droppable.id);

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
      withExpectedAdvancedUsageWarning(() => {
        marshal.collect({ includeCritical: true });
      });

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
        critical,
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

        if (draggable.descriptor.id === critical.draggable.id) {
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
            draggable.descriptor.id !== critical.draggable.id)
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
    it('should abort any pending collection', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const watcher: DimensionWatcher = populateMarshal(marshal);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      marshal.collect({ includeCritical: false });
      resetWatcher(watcher);

      // nothing has been collected yet
      expect(watcher.draggable.getDimension).not.toHaveBeenCalled();

      // another collection
      marshal.collect({ includeCritical: false });
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // nothing has been collected yet
      expect(watcher.draggable.getDimension).not.toHaveBeenCalled();

      // called after a frame
      requestAnimationFrame.step();
      expect(watcher.draggable.getDimension).toHaveBeenCalled();
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // finishing
      requestAnimationFrame.flush();

      expect(callbacks.bulkReplace).toHaveBeenCalledTimes(1);
    });

    it('should abort any pending publish', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const watcher: DimensionWatcher = populateMarshal(marshal);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      resetWatcher(watcher);
      marshal.collect({ includeCritical: false });

      requestAnimationFrame.step();

      // collection has occurred
      expect(watcher.draggable.getDimension).toHaveBeenCalled();
      resetWatcher(watcher);

      // no publish has occurred yet
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // another collection - returning to first phase
      withExpectedAdvancedUsageWarning(() => {
        marshal.collect({ includeCritical: true });
      });
      expect(watcher.draggable.getDimension).not.toHaveBeenCalled();
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      requestAnimationFrame.step();
      // collection has now occurred
      expect(watcher.draggable.getDimension)
        .toHaveBeenCalledTimes(Object.keys(preset.draggables).length);
      // publish has still not occurred
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // lets release the publish
      requestAnimationFrame.step();
      expect(callbacks.bulkReplace).toHaveBeenCalledTimes(1);
    });

    it('should batch multiple collection calls', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      const watcher: DimensionWatcher = populateMarshal(marshal);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      resetWatcher(watcher);
      marshal.collect({ includeCritical: false });
      marshal.collect({ includeCritical: false });
      marshal.collect({ includeCritical: false });

      // nothing has been collected yet
      expect(watcher.draggable.getDimension).not.toHaveBeenCalled();

      requestAnimationFrame.flush();
      expect(callbacks.bulkReplace).toHaveBeenCalledTimes(1);
    });
  });
});

describe('stopping', () => {
  it('should cancel any pending collection', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    const watcher: DimensionWatcher = populateMarshal(marshal);

    marshal.startPublishing(defaultRequest, preset.windowScroll);
    resetWatcher(watcher);
    marshal.collect({ includeCritical: false });

    // nothing has been collected yet
    expect(watcher.droppable.getDimensionAndWatchScroll).not.toHaveBeenCalled();

    // stopping
    marshal.stopPublishing();
    // releasing any frames
    requestAnimationFrame.flush();

    expect(watcher.droppable.getDimensionAndWatchScroll).not.toHaveBeenCalled();
    expect(callbacks.bulkReplace).not.toHaveBeenCalled();
  });

  it('should cancel any pending publish', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    const watcher: DimensionWatcher = populateMarshal(marshal);

    marshal.startPublishing(defaultRequest, preset.windowScroll);
    resetWatcher(watcher);
    marshal.collect({ includeCritical: false });

    // collecting from dom
    requestAnimationFrame.step();
    expect(watcher.droppable.getDimensionAndWatchScroll).toHaveBeenCalled();
    // not published yet
    expect(callbacks.bulkReplace).not.toHaveBeenCalled();

    // stopping
    marshal.stopPublishing();
    // releasing any frames
    requestAnimationFrame.flush();

    expect(callbacks.bulkReplace).not.toHaveBeenCalled();
  });
});

describe('subsequent collections', () => {
  it('should allow subsequent collections during the same drag', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal);

    marshal.startPublishing(defaultRequest, preset.windowScroll);

    const collect = () => {
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();
      marshal.collect({ includeCritical: false });
      requestAnimationFrame.step();
      requestAnimationFrame.step();
      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: withoutCritical,
        viewport: getViewport(),
        critical: null,
      });
      callbacks.bulkReplace.mockReset();
    };

    collect();
    collect();
    collect();
    // cleanup
    marshal.stopPublishing();
  });

  it('should allow subsequent collections due to subsequent drags', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal);

    const collect = () => {
      // initial publish
      const result = marshal.startPublishing(defaultRequest, preset.windowScroll);
      expect(result).toEqual(startResult);
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // start a collection
      marshal.collect({ includeCritical: false });
      expect(callbacks.bulkReplace).not.toHaveBeenCalled();

      // let the collection run through
      requestAnimationFrame.step();
      requestAnimationFrame.step();
      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: withoutCritical,
        viewport: getViewport(),
        critical: null,
      });

      // tell the marshal to stop
      marshal.stopPublishing();
      callbacks.bulkReplace.mockReset();
    };

    collect();
    collect();
    collect();
  });
});
