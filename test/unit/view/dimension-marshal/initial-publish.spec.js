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
  critical, copy,
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

const foreignWithNewType: DroppableDimension = {
  ...preset.foreign,
  descriptor: {
    ...preset.foreign.descriptor,
    id: 'new foreign id',
    type: 'some cool new type',
  },
};

const inForeignWithNewType: DraggableDimension = {
  ...preset.inForeign1,
  descriptor: {
    ...preset.inForeign1.descriptor,
    id: 'new in foreign 1 id',
    type: foreignWithNewType.descriptor.type,
  },
};

const withNewType: DimensionMap = {
  draggables: {
    ...preset.dimensions.draggables,
    [inForeignWithNewType.descriptor.id]: inForeignWithNewType,
  },
  droppables: {
    ...preset.dimensions.droppables,
    [foreignWithNewType.descriptor.id]: foreignWithNewType,
  },
};

it('should publish the registered dimensions (simple)', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());

  marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);
  marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome2);

  const droppableCallbacks: DroppableCallbacks = getDroppableCallbacks(preset.home);
  marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);

  const result: StartPublishingResult =
    marshal.startPublishing(defaultRequest, preset.windowScroll);
  const expected: StartPublishingResult = {
    critical,
    dimensions: {
      draggables: {
        [preset.inHome1.descriptor.id]: preset.inHome1,
        [preset.inHome2.descriptor.id]: preset.inHome2,
      },
      droppables: {
        [preset.home.descriptor.id]: preset.home,
      },
    },
  };
  expect(expected).toEqual(result);
});

// Just checking our preset behaves how we expect
it('should publish the registered dimensions (preset)', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());
  populateMarshal(marshal);

  const result: StartPublishingResult =
    marshal.startPublishing(defaultRequest, preset.windowScroll);

  expect(result).toEqual({
    critical,
    dimensions: preset.dimensions,
  });
});

it('should not publish dimensions that do not have the same type as the critical droppable', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());
  populateMarshal(marshal, withNewType);

  const result: StartPublishingResult =
    marshal.startPublishing(defaultRequest, preset.windowScroll);

  expect(result).toEqual({
    critical,
    // dimensions with new type not gathered
    dimensions: preset.dimensions,
  });
});

it('should not publish dimensions that have been unregistered', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());
  populateMarshal(marshal);
  const expectedMap: DimensionMap = copy(preset.dimensions);

  marshal.unregisterDraggable(preset.inHome2.descriptor);
  delete expectedMap.draggables[preset.inHome2.descriptor.id];

  marshal.unregisterDroppable(preset.foreign.descriptor);
  delete expectedMap.droppables[preset.foreign.descriptor.id];

  // Being a good citizen and also unregistering all of the children
  preset.inForeignList.forEach((draggable: DraggableDimension) => {
    marshal.unregisterDraggable(draggable.descriptor);
    delete expectedMap.draggables[draggable.descriptor.id];
  });

  const result: StartPublishingResult =
    marshal.startPublishing(defaultRequest, preset.windowScroll);

  expect(result).toEqual({
    critical,
    dimensions: expectedMap,
  });
});

it('should publish dimensions that have been updated', () => {

});

describe('subsequent calls', () => {
  it('should return dimensions a subsequent call', () => {

  });

  it('should account for changes after the last call', () => {

  });
});
