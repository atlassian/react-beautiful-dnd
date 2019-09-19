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
  Critical,
} from '../../../../src/types';
import { preset } from '../../../util/preset-action-args';
import { getCallbacksStub } from '../../../util/dimension-marshal';
import { defaultRequest } from './util';
import { makeScrollable } from '../../../util/dimension';
import { setViewport } from '../../../util/viewport';
import getFrame from '../../../../src/state/get-frame';
import type { Registry } from '../../../../src/state/registry/registry-types';
import createRegistry from '../../../../src/state/registry/create-registry';
import {
  getDraggableEntry,
  getDroppableEntry,
  populate,
  type DimensionWatcher,
} from '../../../util/registry';
import { origin } from '../../../../src/state/position';
import patchDimensionMap from '../../../../src/state/patch-dimension-map';
import { withWarn } from '../../../util/console';

const viewport: Viewport = preset.viewport;
setViewport(viewport);

const empty: Published = {
  removals: [],
  additions: [],
  modified: [],
};

function makeVirtual(droppable: DroppableDimension): DroppableDimension {
  return {
    ...droppable,
    descriptor: {
      ...droppable.descriptor,
      mode: 'virtual',
    },
  };
}

const scrollableHome: DroppableDimension = makeScrollable(
  makeVirtual(preset.home),
);
const scrollableForeign: DroppableDimension = makeScrollable(
  makeVirtual(preset.foreign),
);
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
    mode: 'virtual',
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

const critical: Critical = {
  draggable: preset.inHome1.descriptor,
  droppable: scrollableHome.descriptor,
};

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

describe('draggable additions', () => {
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

    registry.draggable.register(
      getDraggableEntry({ dimension: beforeInHome1 }),
    );
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
      modified: [{ droppableId: scrollableHome.descriptor.id, scroll: origin }],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });

  it('should not do anything if trying to add a draggable that does not have the same type as the dragging item', () => {
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
    registry.draggable.register(
      getDraggableEntry({ dimension: beforeInHome2 }),
    );
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
      modified: [{ droppableId: scrollableHome.descriptor.id, scroll: origin }],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });

  it('should log a warning if trying to add or remove a draggable from a non-virtual list', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    const notVirtual: DroppableDimension = {
      ...scrollableHome,
      descriptor: {
        ...scrollableHome.descriptor,
        mode: 'standard',
      },
    };
    const map: DimensionMap = patchDimensionMap(withScrollables, notVirtual);
    populate(registry, map);

    // A publish has started
    marshal.startPublishing(defaultRequest);
    expect(callbacks.collectionStarting).not.toHaveBeenCalled();

    // additions log a warning
    withWarn(() => {
      const beforeInHome1: DraggableDimension = {
        ...preset.inHome1,
        descriptor: {
          ...preset.inHome1.descriptor,
          id: 'b',
          index: 0,
        },
      };
      registry.draggable.register(
        getDraggableEntry({ dimension: beforeInHome1 }),
      );
    });
    // removals log a warning
    withWarn(() => {
      registry.draggable.unregister(
        registry.draggable.getById(preset.inHome2.descriptor.id),
      );
    });

    // neither cause a collection to start
    expect(callbacks.collectionStarting).not.toHaveBeenCalled();
  });
});

describe('draggable removals', () => {
  it('should publish a removal', () => {
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

    registry.draggable.unregister(
      registry.draggable.getById(preset.inHome2.descriptor.id),
    );
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
      modified: [
        { droppableId: scrollableHome.descriptor.id, scroll: origin },
        { droppableId: scrollableForeign.descriptor.id, scroll: origin },
      ],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });

  it('should do nothing if tying to remove a draggable of a different type', () => {
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

  it('should do nothing if removing the critical draggable', () => {
    const callbacks: Callbacks = getCallbacksStub();
    const registry: Registry = createRegistry();
    const marshal: DimensionMarshal = createDimensionMarshal(
      registry,
      callbacks,
    );
    populate(registry, withScrollables);

    marshal.startPublishing(defaultRequest);

    registry.draggable.unregister(
      registry.draggable.getById(critical.draggable.id),
    );

    expect(callbacks.collectionStarting).not.toHaveBeenCalled();
  });
});

describe('droppables', () => {
  it('should not do anything if a droppable is added', () => {
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

  it('should not do anything if a droppable is removed', () => {
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

    registry.droppable.unregister(
      registry.droppable.getById(scrollableForeign.descriptor.id),
    );

    expect(callbacks.collectionStarting).not.toHaveBeenCalled();
  });

  it('should recollect the scroll from droppables that had draggable additions', () => {
    const beforeInHome2: DraggableDimension = {
      ...preset.inHome2,
      descriptor: {
        ...preset.inHome2.descriptor,
        id: 'addition2',
        index: 1,
      },
    };
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

    registry.draggable.register(
      getDraggableEntry({ dimension: beforeInHome2 }),
    );
    expect(callbacks.collectionStarting).toHaveBeenCalled();
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();
    expect(watcher.droppable.getScrollWhileDragging).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();

    // not hiding placeholder in home list

    expect(watcher.droppable.getScrollWhileDragging).toHaveBeenCalledWith(
      scrollableHome.descriptor.id,
      getFrame(scrollableHome).scroll.current,
    );

    const expected: Published = {
      additions: [beforeInHome2],
      removals: [],
      modified: [{ droppableId: scrollableHome.descriptor.id, scroll: origin }],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
  });

  it('should recollect the scroll from droppables that had draggable removals', () => {
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

    registry.draggable.unregister(
      registry.draggable.getById(preset.inHome2.descriptor.id),
    );
    expect(callbacks.collectionStarting).toHaveBeenCalled();
    expect(callbacks.publishWhileDragging).not.toHaveBeenCalled();
    expect(watcher.droppable.getScrollWhileDragging).not.toHaveBeenCalled();

    // Fire the collection / publish step
    requestAnimationFrame.flush();

    // not hiding placeholder in home list

    expect(watcher.droppable.getScrollWhileDragging).toHaveBeenCalledWith(
      scrollableHome.descriptor.id,
      getFrame(scrollableHome).scroll.current,
    );

    const expected: Published = {
      additions: [],
      removals: [preset.inHome2.descriptor.id],
      modified: [{ droppableId: scrollableHome.descriptor.id, scroll: origin }],
    };
    expect(callbacks.publishWhileDragging).toHaveBeenCalledWith(expected);
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
    const expected: StartPublishingResult = {
      critical,
      dimensions: justCritical,
      viewport,
    };
    expect(result).toEqual(expected);

    registry.draggable.register(
      getDraggableEntry({ dimension: preset.inHome2 }),
    );
    expect(callbacks.collectionStarting).toHaveBeenCalled();
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

    registry.draggable.register(
      getDraggableEntry({ dimension: preset.inHome2 }),
    );
    requestAnimationFrame.step();
    expect(callbacks.publishWhileDragging).toHaveBeenCalledTimes(1);
    // $FlowFixMe
    callbacks.publishWhileDragging.mockReset();

    registry.draggable.register(
      getDraggableEntry({ dimension: preset.inHome3 }),
    );
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

    registry.draggable.register(
      getDraggableEntry({ dimension: preset.inHome2 }),
    );
    requestAnimationFrame.step();
    expect(callbacks.publishWhileDragging).toHaveBeenCalledTimes(1);
    // $FlowFixMe
    callbacks.publishWhileDragging.mockReset();

    marshal.stopPublishing();

    // second drag
    marshal.startPublishing(defaultRequest);

    registry.draggable.register(
      getDraggableEntry({ dimension: preset.inHome3 }),
    );
    requestAnimationFrame.step();
    expect(callbacks.publishWhileDragging).toHaveBeenCalledTimes(1);
  });
});
