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
  DimensionMap,
  Publish,
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
  withExpectedAdvancedUsageWarning,
} from './util';

const empty: Publish = {
  removals: {
    draggables: [],
    droppables: [],
  },
  additions: {
    draggables: [],
    droppables: [],
  },
};

const ofAnotherType: DroppableDimension = {
  ...preset.foreign,
  descriptor: {
    type: 'some rogue type',
    id: 'another droppable',
  },
};
const inAnotherType: DraggableDimension = {
  ...preset.inHome1,
  descriptor: {
    type: ofAnotherType.descriptor.type,
    droppableId: ofAnotherType.descriptor.id,
    id: 'addition!',
    index: 0,
  },
};

const justCritical: DimensionMap = {
  draggables: {
    [preset.inHome1.descriptor.id]: preset.inHome1,
  },
  droppables: {
    [preset.home.descriptor.id]: preset.home,
  },
};

afterEach(() => {
  requestAnimationFrame.reset();
});

describe('additions', () => {
  it('should collect and publish the dimensions', () => {
    const beforeInHome1: DraggableDimension = {
      ...preset.inHome1,
      descriptor: {
        ...preset.inHome1.descriptor,
        id: 'addition!',
        index: 0,
      },
    };
    const anotherDroppable: DroppableDimension = {
      ...preset.foreign,
      descriptor: {
        ...preset.foreign.descriptor,
        id: 'another droppable',
      },
    };
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, preset.dimensions);

    // A publish has started
    marshal.startPublishing(defaultRequest, preset.windowScroll);
    expect(callbacks.publish).not.toHaveBeenCalled();

    // Registering a new draggable (inserted before inHome1)
    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(beforeInHome1.descriptor, () => beforeInHome1);
    });
    // Registering a new droppable
    marshal.registerDroppable(anotherDroppable.descriptor, getDroppableCallbacks(anotherDroppable));
    expect(callbacks.publish).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.step();
    const expected: Publish = {
      ...empty,
      additions: {
        droppables: [anotherDroppable],
        draggables: [beforeInHome1],
      },
    };
    expect(callbacks.publish).toHaveBeenCalledWith(expected);
  });

  it('should not collect a dimension that does not have the same type as the dragging item', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, preset.dimensions);

    // A publish has started
    marshal.startPublishing(defaultRequest, preset.windowScroll);
    expect(callbacks.publish).not.toHaveBeenCalled();

    // Registering a new draggable (inserted before inHome1)
    marshal.registerDraggable(inAnotherType.descriptor, () => inAnotherType);
    // Registering a new droppable
    marshal.registerDroppable(ofAnotherType.descriptor, getDroppableCallbacks(ofAnotherType));
    expect(callbacks.publish).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();
    expect(callbacks.publish).not.toHaveBeenCalled();
  });
});

describe('removals', () => {
  it('should publish a removal', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    const anotherDroppable: DroppableDimension = {
      ...preset.foreign,
      descriptor: {
        type: preset.home.descriptor.type,
        id: 'another droppable',
      },
    };
    const dimensions: DimensionMap = {
      draggables: preset.dimensions.draggables,
      droppables: {
        ...preset.dimensions.droppables,
        [anotherDroppable.descriptor.id]: anotherDroppable,
      },
    };
    populateMarshal(marshal, dimensions);

    // A publish has started
    marshal.startPublishing(defaultRequest, preset.windowScroll);
    expect(callbacks.publish).not.toHaveBeenCalled();

    withExpectedAdvancedUsageWarning(() => {
      marshal.unregisterDraggable(preset.inHome2.descriptor);
    });
    marshal.unregisterDroppable(anotherDroppable.descriptor);
    expect(callbacks.publish).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();
    const expected: Publish = {
      additions: {
        droppables: [],
        draggables: [],
      },
      removals: {
        draggables: [preset.inHome2.descriptor.id],
        droppables: [anotherDroppable.descriptor.id],
      },
    };
    expect(callbacks.publish).toHaveBeenCalledWith(expected);
  });

  it('should not publish a removal when the dimension type is not the same as the dragging item', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    const dimensions: DimensionMap = {
      draggables: {
        ...preset.dimensions.draggables,
        [inAnotherType.descriptor.id]: inAnotherType,
      },
      droppables: {
        ...preset.dimensions.droppables,
        [ofAnotherType.descriptor.id]: ofAnotherType,
      },
    };
    populateMarshal(marshal, dimensions);

    // A publish has started
    marshal.startPublishing(defaultRequest, preset.windowScroll);

    marshal.unregisterDraggable(inAnotherType.descriptor);
    // Registering a new droppable
    marshal.unregisterDroppable(ofAnotherType.descriptor);
    expect(callbacks.publish).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();
    // The removals where not published
    expect(callbacks.publish).not.toHaveBeenCalled();
  });

  it('should throw an error if trying to remove a critical dimension', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, preset.dimensions);

    marshal.startPublishing(defaultRequest, preset.windowScroll);

    expect(() => marshal.unregisterDraggable(critical.draggable)).toThrow();
    expect(() => marshal.unregisterDroppable(critical.droppable)).toThrow();
  });
});

describe('cancelling', () => {
  it('should cancel any pending collections', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

    populateMarshal(marshal, justCritical);

    const result: StartPublishingResult =
      marshal.startPublishing(defaultRequest, preset.windowScroll);
    expect(result).toEqual({
      critical,
      dimensions: justCritical,
    });

    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome2);
    });
    marshal.registerDroppable(preset.foreign.descriptor, getDroppableCallbacks(preset.foreign));
    // no request animation fired yet
    expect(callbacks.publish).not.toHaveBeenCalled();

    // marshal told to stop - which should cancel any pending publishes
    marshal.stopPublishing();

    // flushing any frames
    requestAnimationFrame.flush();
    expect(callbacks.publish).not.toHaveBeenCalled();
  });
});

describe('subsequent', () => {
  it('should allow subsequent publishes in the same drag', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, justCritical);

    marshal.startPublishing(defaultRequest, preset.windowScroll);

    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome1);
    });
    requestAnimationFrame.step();
    expect(callbacks.publish).toHaveBeenCalledTimes(1);
    callbacks.publish.mockReset();

    marshal.registerDraggable(preset.inHome3.descriptor, () => preset.inHome3);
    requestAnimationFrame.step();
    expect(callbacks.publish).toHaveBeenCalledTimes(1);
  });

  it('should allow subsequent publishes between drags', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, justCritical);

    marshal.startPublishing(defaultRequest, preset.windowScroll);

    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome1);
    });
    requestAnimationFrame.step();
    expect(callbacks.publish).toHaveBeenCalledTimes(1);

    marshal.registerDraggable(preset.inHome3.descriptor, () => preset.inHome3);
    requestAnimationFrame.step();
    expect(callbacks.publish).toHaveBeenCalledTimes(1);
  });
});

describe('advanced usage warning', () => {
  it('should print an advanced usage warning on the first dynamic change', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });

    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, justCritical);

    marshal.startPublishing(defaultRequest, preset.windowScroll);
    expect(console.warn).not.toHaveBeenCalled();

    marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    console.warn.mockReset();

    marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome2);
    expect(console.warn).not.toHaveBeenCalled();

    console.warn.mockRestore();
  });
});
