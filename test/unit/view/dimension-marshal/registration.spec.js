// @flow
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import type {
  Callbacks,
  DimensionMarshal,
  StartPublishingResult,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  LiftRequest,
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';
import {
  critical,
  preset,
} from '../../../utils/preset-action-args';
import {
  populateMarshal,
  getDroppableCallbacks,
  getCallbacksStub,
  defaultRequest,
} from './util';

describe('draggable', () => {
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
          ...preset.inHome1.descriptor,
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
          droppable: preset.home.descriptor,
        },
        dimensions: {
          draggables: {
            ...preset.dimensions.draggables,
            [moved.descriptor.id]: moved,
          },
          droppables: {
            ...preset.dimensions.droppables,
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

    it('should throw if removing the critical draggable during a drag', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal, preset.dimensions);

      marshal.startPublishing(defaultRequest, preset.windowScroll);

      expect(() => marshal.unregisterDraggable(critical.draggable))
        .toThrow('Cannot remove the dragging item during a drag');
    });
  });
});

describe('droppable', () => {
  describe('update', () => {
    it('should throw if updating the critical dimension during a drag', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal, preset.dimensions);

      marshal.startPublishing(defaultRequest, preset.windowScroll);

      const update = () => {
        marshal.updateDroppable(
          preset.home.descriptor,
          preset.home.descriptor,
          getDroppableCallbacks(preset.home),
        );
      };

      expect(update).toThrow('You are not able to update the id or type of a droppable during a drag');
    });

    it('should throw if updating a non critical droppable during a drag', () => {
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

      expect(update).toThrow('You are not able to update the id or type of a droppable during a drag');
    });
  });

  describe('unregister', () => {
    it('should not delete an entry if the descriptor is out of date', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal, preset.dimensions);

      // Same entry as before, just with a new descriptor reference
      const newRef: DroppableDimension = {
        ...preset.home,
        descriptor: {
          ...preset.home.descriptor,
        },
      };

      // first registering new draggable that overrides old descriptor
      marshal.registerDroppable(newRef.descriptor, getDroppableCallbacks(newRef));

      // now unregistering the old one
      // if this actually removed the entry then the publish would fail
      marshal.unregisterDroppable(preset.home.descriptor);

      // checking that we collect the correct thing

      const result: StartPublishingResult =
        marshal.startPublishing(defaultRequest, preset.windowScroll);
      expect(result).toEqual({
        critical: {
          draggable: preset.inHome1.descriptor,
          droppable: newRef.descriptor,
        },
        dimensions: {
          draggables: preset.dimensions.draggables,
          droppables: {
            ...preset.dimensions.droppables,
            [newRef.descriptor.id]: newRef,
          },
        },
      });
    });

    it('should throw if no droppable was registered', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

      expect(() => marshal.unregisterDroppable(preset.home.descriptor))
        .toThrow(`Cannot unregister Droppable with id ${preset.home.descriptor.id} as as it is not registered`);
    });

    it('should throw if removing the critical droppable during a drag', () => {
      const callbacks: Callbacks = getCallbacksStub();
      const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal, preset.dimensions);

      marshal.startPublishing(defaultRequest, preset.windowScroll);

      expect(() => marshal.unregisterDroppable(critical.droppable))
        .toThrow('Cannot remove the home Droppable during a drag');
    });
  });
});
