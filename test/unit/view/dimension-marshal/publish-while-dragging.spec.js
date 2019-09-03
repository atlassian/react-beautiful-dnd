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
  getCallbacksStub,
} from '../../../util/dimension-marshal';
import { defaultRequest } from './util';
import { makeScrollable } from '../../../util/dimension';
import { setViewport } from '../../../util/viewport';
import { withWarn } from '../../../util/console';
import type {
  Registry,
  DraggableEntry,
} from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';
import {
  getDraggableEntry,
  getDroppableEntry,
  populate,
  type DimensionWatcher,
} from '../../../util/registry';

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
    mode: 'VIRTUAL',
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
  it.only('should collect and publish the draggables', () => {
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
    const registry: Registry = createRegistry();
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // Registering a new draggable (inserted before inHome1)
    withWarn(() => {
      registry.draggable.register(
        getDraggableEntry({ dimension: beforeInHome1 }),
      );
    });
    registry.draggable.register(
      getDraggableEntry({ dimension: beforeInHome2 }),
    );
    expect(callbacks.collectionStarting).toHaveBeenCalled();
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

  it.only('should not do anything if a droppable is added', () => {
    const registry: Registry = createRegistry();
    const callbacks: Callbacks = getCallbacksStub();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    registry.droppable.register(
      getDroppableEntry({ dimension: anotherDroppable }),
    );

    expect(callbacks.collectionStarting).not.toHaveBeenCalled();
  });

  it.only('should not do anything if trying to add a draggable that does not have the same type as the dragging item', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.collectionStarting).not.toHaveBeenCalled();

    // Registering a new draggable (inserted before inHome1)

    registry.draggable.register(
      getDraggableEntry({ dimension: inAnotherType }),
    );
    expect(callbacks.collectionStarting).not.toHaveBeenCalled();
  });

  it.only('should order published draggables by their index', () => {
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
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    // publishing the higher index value first
    withWarn(() => {
      registry.draggable.register(
        getDraggableEntry({ dimension: beforeInHome2 }),
      );
    });
    // publishing the lower index value second
    registry.draggable.register(
      getDraggableEntry({ dimension: beforeInHome1 }),
    );
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
  it.only('should recollect droppables that had internal changes (home)', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    const watcher: DimensionWatcher = populate(registry, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    withWarn(() => {
      registry.draggable.unregister(
        registry.draggable.getById(preset.inHome2.descriptor.id),
      );
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

  it.only('should recollect droppables that had internal changes (foreign)', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    const watcher: DimensionWatcher = populate(registry, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    withWarn(() => {
      registry.draggable.unregister(
        registry.draggable.getById(preset.inForeign1.descriptor.id),
      );
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
  it.only('should publish a removal', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, withScrollables);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();

    withWarn(() => {
      registry.draggable.unregister(
        registry.draggable.getById(preset.inHome2.descriptor.id),
      );
    });
    registry.draggable.unregister(
      registry.draggable.getById(preset.inHome3.descriptor.id),
    );
    registry.draggable.unregister(
      registry.draggable.getById(preset.inForeign1.descriptor.id),
    );
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

  it.only('should do nothing if tying to remove a draggable of a different type', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
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
    populate(registry, dimensions);

    // A publish has started
    marshal.startPublishing(defaultRequest);

    registry.draggable.unregister(
      registry.draggable.getById(inAnotherType.descriptor.id),
    );

    expect(callbacks.collectionStarting).not.toHaveBeenCalled();
  });

  it('should do nothing if trying to remove a critical dimension', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, withScrollables);

    marshal.startPublishing(defaultRequest);

    expect(() => registry.draggable.unregister(critical.draggable)).toThrow(
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
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );

    populate(registry, justCritical);

    const result: StartPublishingResult = marshal.startPublishing(
      defaultRequest,
    );
    expect(result).toEqual({
      critical,
      dimensions: justCritical,
      viewport,
    });

    withWarn(() => {
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
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

    marshal.startPublishing(defaultRequest);

    withWarn(() => {
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
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

    marshal.startPublishing(defaultRequest);

    withWarn(() => {
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
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, justCritical);

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
