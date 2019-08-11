// @flow
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import type {
  Callbacks,
  DimensionMarshal,
  StartPublishingResult,
} from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DimensionMap,
  Published,
  Viewport,
} from '../../../../src/types';
import { critical, preset } from '../../../util/preset-action-args';
import {
  getDroppableCallbacks,
  populateMarshal,
  type DimensionWatcher,
  getCallbacksStub,
} from '../../../util/dimension-marshal';
import { defaultRequest, withExpectedAdvancedUsageWarning } from './util';
import { makeScrollable } from '../../../util/dimension';
import { setViewport } from '../../../util/viewport';

const viewport: Viewport = preset.viewport;
setViewport(viewport);

const empty: Published = {
  removals: [],
  additions: [],
  modified: [],
};

const scrollableHome: DroppableDimension = makeScrollable(preset.home);
const scrollableForeign: DroppableDimension = makeScrollable(preset.foreign);
const withScrollables: DimensionMap = {
  draggables: preset.dimensions.draggables,
  droppables: {
    ...preset.dimensions.droppables,
    [scrollableHome.descriptor.id]: scrollableHome,
    [scrollableForeign.descriptor.id]: scrollableForeign,
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
const anotherDroppable: DroppableDimension = {
  ...preset.foreign,
  descriptor: {
    ...preset.foreign.descriptor,
    id: 'another droppable',
  },
};

// TODO: remove
const justCritical: DimensionMap = {
  draggables: {
    [preset.inHome1.descriptor.id]: preset.inHome1,
  },
  droppables: {
    [preset.home.descriptor.id]: scrollableHome,
  },
};

afterEach(() => {
  requestAnimationFrame.reset();
});

describe('additions', () => {
  it('should collect and publish the draggables', () => {
    const beforeInHome1: DraggableDimension = {
      ...preset.inHome1,
      descriptor: {
        ...preset.inHome1.descriptor,
        id: 'addition1',
        index: 0,
      },
    };
    const beforeInHome2: DraggableDimension = {
      ...preset.inHome2,
      descriptor: {
        ...preset.inHome2.descriptor,
        id: 'addition2',
        index: 1,
      },
    };
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // Registering a new draggable (inserted before inHome1)
    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(beforeInHome1.descriptor, () => beforeInHome1);
    });
    marshal.registerDraggable(beforeInHome2.descriptor, () => beforeInHome2);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.step();
    const expected: Published = {
      ...empty,
      additions: [beforeInHome1, beforeInHome2],
      modified: [scrollableHome],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });

  it('should throw if trying to add a droppable', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    const register = () =>
      marshal.registerDroppable(
        anotherDroppable.descriptor,
        getDroppableCallbacks(anotherDroppable),
      );

    expect(register).toThrow();
  });

  it('should throw if trying to add a draggable that does not have the same type as the dragging item', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // Registering a new draggable (inserted before inHome1)
    const execute = () =>
      marshal.registerDraggable(inAnotherType.descriptor, () => inAnotherType);

    expect(execute).toThrow(
      'This is not of the same type as the dragging item',
    );
  });

  it('should order published draggables by their index', () => {
    const beforeInHome1: DraggableDimension = {
      ...preset.inHome1,
      descriptor: {
        ...preset.inHome1.descriptor,
        id: 'b',
        index: 0,
      },
    };
    const beforeInHome2: DraggableDimension = {
      ...preset.inHome2,
      descriptor: {
        ...preset.inHome2.descriptor,
        // if ordered by a key, this would be first
        id: 'a',
        index: 1,
      },
    };
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // publishing the higher index value first
    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(beforeInHome2.descriptor, () => beforeInHome2);
    });
    // publishing the lower index value second
    marshal.registerDraggable(beforeInHome1.descriptor, () => beforeInHome1);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.step();
    const expected: Published = {
      ...empty,
      // we expect this to be ordered by index
      additions: [beforeInHome1, beforeInHome2],
      modified: [scrollableHome],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });
});

describe('droppables', () => {
  it('should recollect droppables that had internal changes (home)', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    const watcher: DimensionWatcher = populateMarshal(marshal, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    withExpectedAdvancedUsageWarning(() => {
      marshal.unregisterDraggable(preset.inHome2.descriptor);
    });
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();
    expect(watcher.droppable.recollect).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();

    // not hiding placeholder in home list
    expect(watcher.droppable.recollect).toHaveBeenCalledWith(
      scrollableHome.descriptor.id,
      { withoutPlaceholder: false },
    );

    const expected: Published = {
      additions: [],
      removals: [preset.inHome2.descriptor.id],
      modified: [scrollableHome],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });

  it('should recollect droppables that had internal changes (foreign)', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    const watcher: DimensionWatcher = populateMarshal(marshal, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    withExpectedAdvancedUsageWarning(() => {
      marshal.unregisterDraggable(preset.inForeign1.descriptor);
    });
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();
    expect(watcher.droppable.recollect).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();

    // hiding placeholder in foreign list
    expect(watcher.droppable.recollect).toHaveBeenCalledWith(
      scrollableForeign.descriptor.id,
      { withoutPlaceholder: true },
    );

    const expected: Published = {
      additions: [],
      removals: [preset.inForeign1.descriptor.id],
      modified: [scrollableForeign],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });
});

describe('removals', () => {
  it('should publish a removal', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    withExpectedAdvancedUsageWarning(() => {
      marshal.unregisterDraggable(preset.inHome2.descriptor);
    });
    marshal.unregisterDraggable(preset.inHome3.descriptor);
    marshal.unregisterDraggable(preset.inForeign1.descriptor);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();
    const expected: Published = {
      additions: [],
      removals: [
        preset.inHome2.descriptor.id,
        preset.inHome3.descriptor.id,
        preset.inForeign1.descriptor.id,
      ],
      modified: [scrollableHome, scrollableForeign],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });

  it('should throw if tying to remove a draggable of a different type', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    const dimensions: DimensionMap = {
      draggables: {
        ...withScrollables.draggables,
        [inAnotherType.descriptor.id]: inAnotherType,
      },
      droppables: {
        ...withScrollables.droppables,
        [ofAnotherType.descriptor.id]: ofAnotherType,
      },
    };
    populateMarshal(marshal, dimensions);

    // A publish has started
    marshal.startPublishing(defaultRequest);

    const unregister = () =>
      marshal.unregisterDraggable(inAnotherType.descriptor);

    expect(unregister).toThrow(
      'This is not of the same type as the dragging item',
    );
  });

  it('should throw an error if trying to remove a critical dimension', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, withScrollables);

    marshal.startPublishing(defaultRequest);

    expect(() => marshal.unregisterDraggable(critical.draggable)).toThrow(
      'Cannot remove the dragging item during a drag',
    );
    expect(() => marshal.unregisterDroppable(critical.droppable)).toThrow(
      'Cannot add a Droppable during a drag',
    );
  });
});

describe('cancelling mid publish', () => {
  it('should cancel any pending collections', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);

    populateMarshal(marshal, justCritical);

    const result: StartPublishingResult = marshal.startPublishing(
      defaultRequest,
    );
    expect(result).toEqual({
      critical,
      dimensions: justCritical,
      viewport,
    });

    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(
        preset.inHome2.descriptor,
        () => preset.inHome2,
      );
    });
    // no request animation fired yet
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // marshal told to stop - which should cancel any pending publishes
    marshal.stopPublishing();

    // flushing any frames
    requestAnimationFrame.flush();
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();
  });
});

describe('subsequent', () => {
  it('should allow subsequent publishes in the same drag', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, justCritical);

    marshal.startPublishing(defaultRequest);

    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(
        preset.inHome2.descriptor,
        () => preset.inHome1,
      );
    });
    requestAnimationFrame.step();
    expect(callbacks.publishWhileDragging).toHaveBeenCalledTimes(1);
    callbacks.publishWhileDragging.mockReset();

    marshal.registerDraggable(preset.inHome3.descriptor, () => preset.inHome3);
    requestAnimationFrame.step();
    expect(callbacks.publishWhileDragging).toHaveBeenCalledTimes(1);
  });

  it('should allow subsequent publishes between drags', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, justCritical);

    marshal.startPublishing(defaultRequest);

    withExpectedAdvancedUsageWarning(() => {
      marshal.registerDraggable(
        preset.inHome2.descriptor,
        () => preset.inHome1,
      );
    });
    requestAnimationFrame.step();
    expect(callbacks.publishWhileDragging).toHaveBeenCalledTimes(1);
    callbacks.publishWhileDragging.mockReset();

    marshal.stopPublishing();

    // second drag
    marshal.startPublishing(defaultRequest);

    marshal.registerDraggable(preset.inHome3.descriptor, () => preset.inHome3);
    requestAnimationFrame.step();
    expect(callbacks.publishWhileDragging).toHaveBeenCalledTimes(1);
  });
});

describe('advanced usage warning', () => {
  it('should print an advanced usage warning on the first dynamic change', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
    populateMarshal(marshal, justCritical);

    marshal.startPublishing(defaultRequest);
    expect(console.warn).not.toHaveBeenCalled();

    marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    console.warn.mockReset();

    marshal.registerDraggable(preset.inHome2.descriptor, () => preset.inHome2);
    expect(console.warn).not.toHaveBeenCalled();

    console.warn.mockRestore();
  });
});
