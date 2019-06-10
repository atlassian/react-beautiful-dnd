// @flow
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import {
  getCallbacksStub,
  getDroppableCallbacks,
  populateMarshal,
} from '../../../utils/dimension-marshal';
import { copy, critical, preset } from '../../../utils/preset-action-args';
import type {
  DimensionMarshal,
  DroppableCallbacks,
  StartPublishingResult,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  LiftRequest,
  DraggableDimension,
  DroppableDimension,
  DimensionMap,
  Viewport,
} from '../../../../src/types';
import { setViewport } from '../../../utils/viewport';

const viewport: Viewport = preset.viewport;
setViewport(viewport);

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

  const droppableCallbacks: DroppableCallbacks = getDroppableCallbacks(
    preset.home,
  );
  marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);

  const result: StartPublishingResult = marshal.startPublishing(defaultRequest);
  const expected: StartPublishingResult = {
    critical,
    viewport,
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

  const result: StartPublishingResult = marshal.startPublishing(defaultRequest);

  expect(result).toEqual({
    critical,
    dimensions: preset.dimensions,
    viewport,
  });
});

it('should not publish dimensions that do not have the same type as the critical droppable', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());
  populateMarshal(marshal, withNewType);

  const result: StartPublishingResult = marshal.startPublishing(defaultRequest);

  expect(result).toEqual({
    critical,
    // dimensions with new type not gathered
    dimensions: preset.dimensions,
    viewport,
  });
});

it('should not publish dimensions that have been unregistered', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());
  populateMarshal(marshal, preset.dimensions);
  const expectedMap: DimensionMap = copy(preset.dimensions);

  marshal.unregisterDraggable(preset.inHome2.descriptor);
  delete expectedMap.draggables[preset.inHome2.descriptor.id];

  marshal.unregisterDroppable(preset.foreign.descriptor);
  delete expectedMap.droppables[preset.foreign.descriptor.id];

  // Being a good citizen and also unregistering all of the foreign draggables
  preset.inForeignList.forEach((draggable: DraggableDimension) => {
    marshal.unregisterDraggable(draggable.descriptor);
    delete expectedMap.draggables[draggable.descriptor.id];
  });

  const result: StartPublishingResult = marshal.startPublishing(defaultRequest);

  expect(result).toEqual({
    critical,
    dimensions: expectedMap,
    viewport,
  });
  expect(result).not.toEqual({
    critical,
    dimensions: preset.dimensions,
    viewport,
  });
});

it('should publish draggables that have been updated (index change)', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());
  populateMarshal(marshal, preset.dimensions);

  const updatedInHome2: DraggableDimension = {
    ...preset.inHome2,
    descriptor: {
      ...preset.inHome2.descriptor,
      index: 10000,
    },
  };
  marshal.updateDraggable(
    preset.inHome2.descriptor,
    updatedInHome2.descriptor,
    () => updatedInHome2,
  );

  const result: StartPublishingResult = marshal.startPublishing(defaultRequest);
  const expected: DimensionMap = copy(preset.dimensions);
  expected.draggables[preset.inHome2.descriptor.id] = updatedInHome2;
  expect(result).toEqual({
    critical,
    dimensions: expected,
    viewport,
  });
});

it('should publish droppables that have been updated (id change)', () => {
  const marshal: DimensionMarshal = createDimensionMarshal(getCallbacksStub());
  populateMarshal(marshal, preset.dimensions);
  const expected: DimensionMap = copy(preset.dimensions);

  // changing the id of home
  const updatedHome: DroppableDimension = {
    ...preset.home,
    descriptor: {
      ...preset.home.descriptor,
      id: 'some new id',
    },
  };
  marshal.unregisterDroppable(preset.home.descriptor);
  marshal.registerDroppable(
    updatedHome.descriptor,
    getDroppableCallbacks(updatedHome),
  );
  delete expected.droppables[preset.home.descriptor.id];
  expected.droppables[updatedHome.descriptor.id] = updatedHome;

  // changing the droppable id of all the draggables in home
  preset.inHomeList.forEach((draggable: DraggableDimension) => {
    const updated: DraggableDimension = {
      ...draggable,
      descriptor: {
        ...draggable.descriptor,
        droppableId: updatedHome.descriptor.id,
      },
    };
    marshal.updateDraggable(
      draggable.descriptor,
      updated.descriptor,
      () => updated,
    );
    expected.draggables[draggable.descriptor.id] = updated;
  });

  const result: StartPublishingResult = marshal.startPublishing(defaultRequest);

  expect(result).toEqual({
    viewport,
    critical: {
      draggable: {
        ...critical.draggable,
        droppableId: updatedHome.descriptor.id,
      },
      droppable: updatedHome.descriptor,
    },
    dimensions: expected,
  });
});

describe('subsequent calls', () => {
  const start = (marshal: DimensionMarshal) =>
    marshal.startPublishing(defaultRequest);
  const stop = (marshal: DimensionMarshal) => marshal.stopPublishing();

  it('should return dimensions a subsequent call', () => {
    const marshal: DimensionMarshal = createDimensionMarshal(
      getCallbacksStub(),
    );
    populateMarshal(marshal, preset.dimensions);
    const expected: StartPublishingResult = {
      critical,
      dimensions: preset.dimensions,
      viewport,
    };

    expect(start(marshal)).toEqual(expected);
    stop(marshal);
    expect(start(marshal)).toEqual(expected);
    stop(marshal);
    expect(start(marshal)).toEqual(expected);
    stop(marshal);
  });

  it('should throw if starting asked to start before stopping', () => {
    const marshal: DimensionMarshal = createDimensionMarshal(
      getCallbacksStub(),
    );
    populateMarshal(marshal, preset.dimensions);

    start(marshal);
    expect(() => start(marshal)).toThrow();
  });

  it('should account for changes after the last call', () => {
    const marshal: DimensionMarshal = createDimensionMarshal(
      getCallbacksStub(),
    );
    populateMarshal(marshal, preset.dimensions);

    // Start first publish
    const result1: StartPublishingResult = start(marshal);
    expect(result1).toEqual({
      critical,
      dimensions: preset.dimensions,
      viewport,
    });

    // Update while first drag is occurring

    const updatedInHome2: DraggableDimension = {
      ...preset.inHome2,
      descriptor: {
        ...preset.inHome2.descriptor,
        index: 10000,
      },
    };
    marshal.updateDraggable(
      preset.inHome2.descriptor,
      updatedInHome2.descriptor,
      () => updatedInHome2,
    );
    const expected: DimensionMap = copy(preset.dimensions);
    expected.draggables[updatedInHome2.descriptor.id] = updatedInHome2;

    // Stop the first publish
    stop(marshal);

    // Start the second publish
    const result2: StartPublishingResult = start(marshal);
    expect(result2).toEqual({
      critical,
      dimensions: expected,
      viewport,
    });
  });
});
