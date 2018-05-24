// @flow
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import { getPreset } from '../../../utils/dimension';
import type {
  Callbacks,
  DimensionMarshal,
  DroppableCallbacks,
  StartPublishingResult,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import getViewport from '../../../../src/view/window/get-viewport';
import type {
  LiftRequest,
  DraggableDimension,
  DroppableDimension,
  DimensionMap,
} from '../../../../src/types';
import {
  critical,
  criticalDimensions,
} from '../../../utils/preset-action-args';
import {
  populateMarshal,
  getDroppableCallbacks,
  withExpectedAdvancedUsageWarning,
  getCallbacksStub,
} from './util';

const preset = getPreset();

const defaultRequest: LiftRequest = {
  draggableId: critical.draggable.id,
  scrollOptions: {
    shouldPublishImmediately: false,
  },
};

describe('draggable', () => {
  describe('register', () => {
    it('should collect dimensions that are registered when doing a collection', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);
      marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome2);

      const droppableCallbacks: DroppableCallbacks = getDroppableCallbacks(preset.home);
      marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);

      const result: StartPublishingResult =
        marshal.startPublishing(defaultRequest, preset.windowScroll);
      const expected: StartPublishingResult = {
        critical,
        dimensions: criticalDimensions,
      };
      expect(result).toEqual(expected);

      marshal.collect({ includeCritical: false });

      requestAnimationFrame.step();
      requestAnimationFrame.step();

      expect(callbacks.bulkReplace).toBeCalledWith({
        dimensions: {
          droppables: {},
          draggables: {
            [preset.inHome2.descriptor.id]: preset.inHome2,
          },
        },
        viewport: getViewport(),
        critical: null,
      });
    });

    it('should start a collection if a draggable is registered during a drag', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal, criticalDimensions);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      marshal.collect({ includeCritical: false });

      requestAnimationFrame.flush();
      expect(callbacks.bulkReplace).toHaveBeenCalledTimes(1);
      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: {
          draggables: {},
          droppables: {},
        },
        critical: null,
        viewport: getViewport(),
      });
      callbacks.bulkReplace.mockReset();

      // advanced usage warning
      withExpectedAdvancedUsageWarning(() => {
        marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome2);
      });

      requestAnimationFrame.flush();
      expect(callbacks.bulkReplace).toHaveBeenCalledTimes(1);
      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: {
          draggables: {
            [preset.inHome1.descriptor.id]: preset.inHome1,
            [preset.inHome2.descriptor.id]: preset.inHome2,
          },
          droppables: {
            [preset.home.descriptor.id]: preset.home,
          },
        },
        critical,
        viewport: getViewport(),
      });
    });
  });

  describe('update', () => {
    it('should throw if there is no previous registration', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      const update = () => {
        marshal.updateDraggable(
          preset.inHome1.descriptor,
          preset.inHome1.descriptor,
          () => preset.inHome1
        );
      };

      expect(update).toThrow('Cannot update draggable registration as no previous registration was found');
    });

    describe('drag not occurring', () => {
      it('should override any existing entry for the next collection', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        const updated: DraggableDimension = {
          ...preset.inHome1,
          descriptor: {
            id: preset.inHome1.descriptor.id,
            index: 100,
            droppableId: preset.home.descriptor.id,
          },
        };

        marshal.updateDraggable(
          critical.draggable,
          updated.descriptor,
          () => updated
        );

        const result: StartPublishingResult =
          marshal.startPublishing(defaultRequest, preset.windowScroll);

        expect(result).toEqual({
          dimensions: {
            draggables: {
              [updated.descriptor.id]: updated,
            },
            droppables: {
              [preset.home.descriptor.id]: preset.home,
            },
          },
          critical: {
            draggable: updated.descriptor,
            droppable: critical.droppable,
          },
        });
      });
    });

    describe('drag occurring', () => {
      it('should throw if the id is changing', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        marshal.startPublishing(defaultRequest, preset.windowScroll);

        const update = () => {
          const updated: DraggableDimension = {
            ...preset.inHome1,
            descriptor: {
              ...preset.inHome1.descriptor,
              id: 'some new id',
            },
          };

          marshal.updateDraggable(
            critical.draggable,
            updated.descriptor,
            () => updated
          );
        };

        expect(update).toThrow('Cannot update a Draggables id during a drag');
      });

      it('should throw if the droppableId is changing', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        marshal.startPublishing(defaultRequest, preset.windowScroll);

        const update = () => {
          const updated: DraggableDimension = {
            ...preset.inHome1,
            descriptor: {
              ...preset.inHome1.descriptor,
              droppableId: preset.foreign.descriptor.id,
            },
          };

          marshal.updateDraggable(
            critical.draggable,
            updated.descriptor,
            () => updated
          );
        };

        expect(update).toThrow('Cannot update a Draggables Droppable during a drag');
      });

      it('should trigger a recollection if the index changes', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        marshal.startPublishing(defaultRequest, preset.windowScroll);
        marshal.collect({ includeCritical: false });

        requestAnimationFrame.flush();
        expect(callbacks.bulkReplace).toHaveBeenCalled();
        callbacks.bulkReplace.mockReset();

        const updated: DraggableDimension = {
          ...preset.inHome1,
          descriptor: {
            ...preset.inHome1.descriptor,
            index: 100,
          },
        };

        withExpectedAdvancedUsageWarning(() => {
          marshal.updateDraggable(
            critical.draggable,
            updated.descriptor,
            () => updated
          );
        });
        expect(callbacks.bulkReplace).not.toHaveBeenCalled();

        requestAnimationFrame.flush();
        expect(callbacks.bulkReplace).toHaveBeenCalledWith({
          dimensions: {
            draggables: {
              [updated.descriptor.id]: updated,
            },
            droppables: {
              [preset.home.descriptor.id]: preset.home,
            },
          },
          critical: {
            droppable: critical.droppable,
            draggable: updated.descriptor,
          },
          viewport: getViewport(),
        });
      });
    });
  });

  describe('unregister', () => {
    it('should not delete an entry if the descriptor is out of date', () => {
      // this can occur when moving an item from list to another
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      // faking a movement of inHome1 to foreign
      const moved: DraggableDimension = {
        ...preset.inHome1,
        descriptor: {
          id: preset.inHome1.descriptor.id,
          droppableId: preset.foreign.descriptor.id,
          index: 100,
        },
      };

      // first registering new draggable that overrides old descriptor
      marshal.registerDraggable(moved.descriptor, () => moved);

      // now unregistering the old one
      // if this actually removed the entry then the publish would fail
      marshal.unregisterDraggable(preset.inHome1.descriptor);

      // checking that we collect the correct thing

      const result: StartPublishingResult =
        marshal.startPublishing(defaultRequest, preset.windowScroll);
      expect(result).toEqual({
        critical: {
          draggable: moved.descriptor,
          droppable: preset.foreign.descriptor,
        },
        dimensions: {
          draggables: {
            [moved.descriptor.id]: moved,
          },
          droppables: {
            [preset.foreign.descriptor.id]: preset.foreign,
          },
        },
      });
    });

    it('should throw if no draggable was registered', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      expect(() => marshal.unregisterDraggable(preset.inHome1.descriptor))
        .toThrow(`Cannot unregister Draggable with id ${preset.inHome1.descriptor.id} as it is not registered`);
    });

    it('should not try to collect dimensions that have been unregistered', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);
      marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome2);

      // registering and unregistering inHome3
      marshal.registerDraggable(preset.inHome3.descriptor, () => preset.inHome3);
      marshal.unregisterDraggable(preset.inHome3.descriptor);

      const droppableCallbacks: DroppableCallbacks = getDroppableCallbacks(preset.home);
      marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);

      const result: StartPublishingResult =
      marshal.startPublishing(defaultRequest, preset.windowScroll);
      const expected: StartPublishingResult = {
        critical,
        dimensions: criticalDimensions,
      };
      expect(result).toEqual(expected);

      marshal.collect({ includeCritical: false });

      requestAnimationFrame.step();
      requestAnimationFrame.step();

      expect(callbacks.bulkReplace).toBeCalledWith({
        dimensions: {
          droppables: {},
          draggables: {
            [preset.inHome2.descriptor.id]: preset.inHome2,
          },
        },
        viewport: getViewport(),
        critical: null,
      });
    });

    describe('drag occurring', () => {
      it('should throw if removing the critical draggable', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        marshal.startPublishing(defaultRequest, preset.windowScroll);

        expect(() => marshal.unregisterDraggable(critical.draggable))
          .toThrow('Cannot unregister dragging item during a drag');
      });

      it('should start a collection', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        const dimensions: DimensionMap = {
          draggables: {
            [preset.inHome1.descriptor.id]: preset.inHome1,
            [preset.inHome2.descriptor.id]: preset.inHome2,
            [preset.inHome3.descriptor.id]: preset.inHome3,
          },
          droppables: {
            [preset.home.descriptor.id]: preset.home,
          },
        };
        populateMarshal(marshal, dimensions);

        // initial collection
        marshal.startPublishing(defaultRequest, preset.windowScroll);
        marshal.collect({ includeCritical: false });
        requestAnimationFrame.flush();
        expect(callbacks.bulkReplace).toHaveBeenCalled();
        callbacks.bulkReplace.mockReset();

        // unregister
        withExpectedAdvancedUsageWarning(() => {
          marshal.unregisterDraggable(preset.inHome3.descriptor);
        });
        requestAnimationFrame.flush();

        expect(callbacks.bulkReplace).toHaveBeenCalledWith({
          dimensions: {
            draggables: {
              [preset.inHome1.descriptor.id]: preset.inHome1,
              [preset.inHome2.descriptor.id]: preset.inHome2,
            },
            droppables: {
              [preset.home.descriptor.id]: preset.home,
            },
          },
          critical,
          viewport: getViewport(),
        });
      });
    });
  });
});

describe('droppable', () => {
  describe('register', () => {
    it('should collect dimensions that are registered when doing a collection', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      // registering draggable
      marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);

      // registering droppables
      marshal.registerDroppable(preset.home.descriptor, getDroppableCallbacks(preset.home));
      marshal.registerDroppable(preset.foreign.descriptor, getDroppableCallbacks(preset.foreign));

      const result: StartPublishingResult =
        marshal.startPublishing(defaultRequest, preset.windowScroll);
      const expected: StartPublishingResult = {
        critical,
        dimensions: criticalDimensions,
      };
      expect(result).toEqual(expected);

      marshal.collect({ includeCritical: false });

      requestAnimationFrame.step();
      requestAnimationFrame.step();

      expect(callbacks.bulkReplace).toBeCalledWith({
        dimensions: {
          droppables: {
            [preset.foreign.descriptor.id]: preset.foreign,
          },
          draggables: {},
        },
        viewport: getViewport(),
        critical: null,
      });
    });

    it('should start a collection if a droppable is registered during a drag', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal, criticalDimensions);

      marshal.startPublishing(defaultRequest, preset.windowScroll);
      marshal.collect({ includeCritical: false });

      requestAnimationFrame.flush();
      expect(callbacks.bulkReplace).toHaveBeenCalledTimes(1);
      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: {
          draggables: {},
          droppables: {},
        },
        critical: null,
        viewport: getViewport(),
      });
      callbacks.bulkReplace.mockReset();

      // advanced usage warning
      withExpectedAdvancedUsageWarning(() => {
        marshal.registerDroppable(preset.foreign.descriptor, getDroppableCallbacks(preset.foreign));
      });

      requestAnimationFrame.flush();
      expect(callbacks.bulkReplace).toHaveBeenCalledTimes(1);
      expect(callbacks.bulkReplace).toHaveBeenCalledWith({
        dimensions: {
          draggables: {
            [preset.inHome1.descriptor.id]: preset.inHome1,
          },
          droppables: {
            [preset.home.descriptor.id]: preset.home,
            [preset.foreign.descriptor.id]: preset.foreign,
          },
        },
        critical,
        viewport: getViewport(),
      });
    });
  });

  describe('update', () => {
    describe('drag not occurring', () => {
      it('should override any existing entry for the next collection', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        const updated: DroppableDimension = {
          ...preset.home,
          descriptor: {
            id: preset.home.descriptor.id,
            type: 'some new type',
          },
        };

        marshal.updateDroppable(
          critical.droppable,
          updated.descriptor,
          getDroppableCallbacks(updated),
        );

        const result: StartPublishingResult =
          marshal.startPublishing(defaultRequest, preset.windowScroll);

        expect(result).toEqual({
          dimensions: {
            draggables: {
              [preset.inHome1.descriptor.id]: preset.inHome1,
            },
            droppables: {
              [updated.descriptor.id]: updated,
            },
          },
          critical: {
            draggable: critical.draggable,
            droppable: updated.descriptor,
          },
        });
      });
    });

    describe('during a drag (not allowed)', () => {
      it('should throw if updating the critical dimension', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        marshal.startPublishing(defaultRequest, preset.windowScroll);

        const update = () => {
          marshal.updateDroppable(
            preset.home.descriptor,
            preset.home.descriptor,
            getDroppableCallbacks(preset.home),
          );
        };

        expect(update).toThrow('Cannot update a Droppable id or type during a drag');
      });

      it('should throw if updating non critical droppable', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal);

        marshal.startPublishing(defaultRequest, preset.windowScroll);

        const update = () => {
          marshal.updateDroppable(
            preset.foreign.descriptor,
            preset.foreign.descriptor,
            getDroppableCallbacks(preset.foreign),
          );
        };

        expect(update).toThrow('Cannot update a Droppable id or type during a drag');
      });
    });
  });

  describe('unregister', () => {
    it('should not delete an entry if the descriptor is out of date', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      const changed: DroppableDimension = {
        ...preset.home,
        descriptor: {
          id: preset.home.descriptor.id,
          type: 'Some new type',
        },
      };

      // first registering new draggable that overrides old descriptor
      marshal.registerDroppable(changed.descriptor, getDroppableCallbacks(changed));

      // now unregistering the old one
      // if this actually removed the entry then the publish would fail
      marshal.unregisterDroppable(preset.home.descriptor);

      // checking that we collect the correct thing

      const result: StartPublishingResult =
        marshal.startPublishing(defaultRequest, preset.windowScroll);
      expect(result).toEqual({
        critical: {
          draggable: preset.inHome1.descriptor,
          droppable: changed.descriptor,
        },
        dimensions: {
          draggables: {
            [preset.inHome1.descriptor.id]: preset.inHome1,
          },
          droppables: {
            [changed.descriptor.id]: changed,
          },
        },
      });
    });

    it('should throw if no dropable was registered', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      expect(() => marshal.unregisterDroppable(preset.home.descriptor))
        .toThrow(`Cannot unregister Droppable with id ${preset.home.descriptor.id} as as it is not registered`);
    });

    it('should not try to collect dimensions that have been unregistered', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      marshal.registerDroppable(preset.home.descriptor, getDroppableCallbacks(preset.home));
      marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);

      // registering and unregistering foreign
      marshal.registerDroppable(preset.foreign.descriptor, getDroppableCallbacks(preset.foreign));
      marshal.unregisterDroppable(preset.foreign.descriptor);

      const result: StartPublishingResult =
      marshal.startPublishing(defaultRequest, preset.windowScroll);
      const expected: StartPublishingResult = {
        critical,
        dimensions: criticalDimensions,
      };
      expect(result).toEqual(expected);

      // checking that foreign is not collected in collection
      marshal.collect({ includeCritical: false });
      requestAnimationFrame.flush();

      expect(callbacks.bulkReplace).toBeCalledWith({
        dimensions: {
          droppables: {},
          draggables: {},
        },
        viewport: getViewport(),
        critical: null,
      });
    });

    describe('drag occurring', () => {
      it('should throw if removing the critical droppable', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, criticalDimensions);

        marshal.startPublishing(defaultRequest, preset.windowScroll);

        expect(() => marshal.unregisterDroppable(critical.droppable))
          .toThrow('Cannot unregister home droppable during a drag');
      });

      it('should start a collection', () => {
        const callbacks: Callbacks = getCallbacksStub();
        const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
        const dimensions: DimensionMap = {
          draggables: {
            [preset.inHome1.descriptor.id]: preset.inHome1,
          },
          droppables: {
            [preset.home.descriptor.id]: preset.home,
            [preset.foreign.descriptor.id]: preset.foreign,
          },
        };
        populateMarshal(marshal, dimensions);

        // initial collection
        marshal.startPublishing(defaultRequest, preset.windowScroll);
        marshal.collect({ includeCritical: false });
        requestAnimationFrame.flush();
        expect(callbacks.bulkReplace).toHaveBeenCalledWith({
          dimensions: {
            draggables: {
            },
            droppables: {
              [preset.foreign.descriptor.id]: preset.foreign,
            },
          },
          critical: null,
          viewport: getViewport(),
        });
        callbacks.bulkReplace.mockReset();

        // unregister
        withExpectedAdvancedUsageWarning(() => {
          marshal.unregisterDroppable(preset.foreign.descriptor);
        });
        requestAnimationFrame.flush();

        expect(callbacks.bulkReplace).toHaveBeenCalledWith({
          dimensions: {
            draggables: {
              [preset.inHome1.descriptor.id]: preset.inHome1,
            },
            droppables: {
              [preset.home.descriptor.id]: preset.home,
            },
          },
          critical,
          viewport: getViewport(),
        });
      });
    });
  });
});
