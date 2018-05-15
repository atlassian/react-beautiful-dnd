// @flow
import invariant from 'tiny-invariant';
import middleware from '../../../../src/state/middleware/hooks';
import messagePreset from '../../../../src/state/middleware/util/message-preset';
import { add } from '../../../../src/state/position';
import {
  clean,
  prepare,
  initialPublish,
  bulkReplace,
  completeDrop,
  move,
  moveForward,
  bulkCollectionStarting,
  type InitialPublishArgs,
  type MoveArgs,
  type BulkReplaceArgs,
} from '../../../../src/state/action-creators';
import createStore from './util/create-store';
import { getPreset } from '../../../utils/dimension';
import getViewport from '../../../../src/view/window/get-viewport';
import type {
  DraggableLocation,
  Store,
  Hooks,
  State,
  Announce,
  Critical,
  DragStart,
  DragUpdate,
  DropResult,
  Viewport,
  HookProvided,
  DraggableDimension,
  DimensionMap,
} from '../../../../../src/types';

const preset = getPreset();

const createHooks = (): Hooks => ({
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

const getAnnounce = (): Announce => jest.fn();

// Using the same scroll as the preset
const viewport: Viewport = {
  ...getViewport(),
  scroll: preset.windowScroll,
};

const initialPublishArgs: InitialPublishArgs = {
  critical: {
    draggable: preset.inHome1.descriptor,
    droppable: preset.home.descriptor,
  },
  dimensions: preset.dimensions,
  client: {
    selection: preset.inHome1.client.borderBox.center,
    borderBoxCenter: preset.inHome1.client.borderBox.center,
    offset: { x: 0, y: 0 },
  },
  viewport,
  autoScrollMode: 'FLUID',
};

const initialBulkReplaceArgs: BulkReplaceArgs = {
  dimensions: preset.dimensions,
  viewport,
  critical: null,
};

const getDragStart = (critical: Critical): DragStart => ({
  draggableId: critical.draggable.id,
  type: critical.droppable.type,
  source: {
    droppableId: critical.droppable.id,
    index: critical.draggable.index,
  },
});

describe('start', () => {
  it('should call the onDragStart hook when a initial publish occurs', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    // prepare step should not trigger hook
    store.dispatch(prepare());
    expect(hooks.onDragStart).not.toHaveBeenCalled();

    // first initial publish
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledWith(
      getDragStart(initialPublishArgs.critical),
      expect.any(Object),
    );
  });

  it('should throw an exception if an initial publish is called before a drag ends', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    const execute = () => {
      store.dispatch(initialPublish(initialPublishArgs));
    };
    // first execution is all good
    execute();
    expect(hooks.onDragStart).toHaveBeenCalled();

    // should not happen
    expect(execute).toThrow();
  });
});

describe('drop', () => {
  it('should call the onDragEnd hook when a DROP_COMPLETE action occurs', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    store.dispatch(bulkReplace(initialBulkReplaceArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

    const result: DropResult = {
      ...getDragStart(initialPublishArgs.critical),
      destination: {
        droppableId: preset.home.descriptor.id,
        index: 2,
      },
      reason: 'DROP',
    };
    store.dispatch(completeDrop(result));
    expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
  });

  it('should throw an exception if there was no drag start published', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    const result: DropResult = {
      ...getDragStart(initialPublishArgs.critical),
      destination: {
        droppableId: preset.home.descriptor.id,
        index: 2,
      },
      reason: 'DROP',
    };

    // throws when in idle
    expect(() => store.dispatch(completeDrop(result))).toThrow();

    // throws if trying to drop while preparing
    store.dispatch(prepare());
    expect(() => store.dispatch(completeDrop(result))).toThrow();
  });
});

describe('update', () => {
  it('should call onDragUpdate if the position has changed on move', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(bulkReplace(initialBulkReplaceArgs));
    // not called yet as position has not changed
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    // Okay let's move it
    store.dispatch(moveForward());
    const update: DragUpdate = {
      ...getDragStart(initialPublishArgs.critical),
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
        index: initialPublishArgs.critical.draggable.index + 1,
      },
    };
    expect(hooks.onDragUpdate).toHaveBeenCalledWith(
      update,
      expect.any(Object),
    );
  });

  it('should not call onDragUpdate if the position has not changed in the first bulk publish', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(bulkReplace(initialBulkReplaceArgs));
    // not called yet as position has not changed
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();
  });

  it('should call onDragUpdate if the position has changed due to a bulk publish', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    // initial publish and bulk publish
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    store.dispatch(bulkReplace(initialBulkReplaceArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    // another bulk publish is in the works
    store.dispatch(bulkCollectionStarting());

    const { dimensions, critical } = initialPublishArgs;
    const withNewIndex: DraggableDimension = {
      ...dimensions.draggables[critical.draggable.id],
      descriptor: {
        ...critical.draggable,
        index: critical.draggable.index + 100,
      },
    };

    const newCritical: Critical = {
      draggable: withNewIndex.descriptor,
      droppable: initialPublishArgs.critical.droppable,
    };

    const customDimensions: DimensionMap = {
      droppables: dimensions.droppables,
      // for simplicity just removing the other dimensions
      draggables: {
        [initialPublishArgs.critical.draggable.id]: withNewIndex,
      },
    };

    store.dispatch(bulkReplace({
      dimensions: customDimensions,
      viewport,
      critical: newCritical,
    }));

    const update: DragUpdate = {
      draggableId: critical.draggable.id,
      type: critical.droppable.type,
      source: {
        droppableId: critical.droppable.id,
        // now states that the new index is the starting index
        index: withNewIndex.descriptor.index,
      },
      // because we removed everything else, it will now be in the first position :D
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
        index: 0,
      },
    };
    expect(hooks.onDragUpdate).toHaveBeenCalledWith(
      update,
      expect.any(Object),
    );
  });

  it('should not call onDragUpdate if there is no movement from the last update', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(bulkReplace(initialBulkReplaceArgs));
    // not called yet as position has not changed
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    // A movement to the same index is not causing an update
    const moveArgs: MoveArgs = {
      // tiny change
      client: add(initialPublishArgs.client.selection, { x: 1, y: 1 }),
      shouldAnimate: true,
    };
    store.dispatch(move(moveArgs));

    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    // Triggering an actual movement
    store.dispatch(moveForward());
    expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);

    const state: State = store.getState();
    invariant(state.phase === 'DRAGGING', 'Expecting state to be in dragging phase');

    // A small movement that should not trigger any index changes
    store.dispatch(move({
      client: add(state.current.client.selection, { x: -1, y: -1 }),
      shouldAnimate: true,
    }));

    expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('abort', () => {
  it('should not do anything if a drag had not started', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(clean());
    expect(hooks.onDragStart).not.toHaveBeenCalled();

    // entering preparing phase
    store.dispatch(prepare());
    expect(store.getState().phase).toBe('PREPARING');

    // cancelling drag before publish
    store.dispatch(clean());
    expect(hooks.onDragStart).not.toHaveBeenCalled();
    expect(hooks.onDragEnd).not.toHaveBeenCalled();
  });

  it('should call onDragEnd with the last published critical descriptor', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(clean());
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalled();

    store.dispatch(clean());
    const expected: DropResult = {
      ...getDragStart(initialPublishArgs.critical),
      destination: null,
      reason: 'CANCEL',
    };
    expect(hooks.onDragEnd).toHaveBeenCalledWith(
      expected,
      expect.any(Object),
    );
  });

  it('should publish an onDragEnd with no destination even if there is a current destination', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(clean());
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));

    const state: State = store.getState();
    invariant(state.phase === 'BULK_COLLECTING');
    // in home location
    const home: DraggableLocation = {
      droppableId: initialPublishArgs.critical.droppable.id,
      index: initialPublishArgs.critical.draggable.index,
    };
    expect(state.impact.destination).toEqual(home);

    store.dispatch(clean());
    const expected: DropResult = {
      ...getDragStart(initialPublishArgs.critical),
      // destination has been cleared
      destination: null,
      reason: 'CANCEL',
    };
    expect(hooks.onDragEnd).toHaveBeenCalledWith(
      expected,
      expect.any(Object),
    );
  });

  it('should not publish an onDragEnd if aborted after a drop', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    // lift
    store.dispatch(clean());
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalled();

    // drop
    const result: DropResult = {
      ...getDragStart(initialPublishArgs.critical),
      destination: null,
      reason: 'CANCEL',
    };
    store.dispatch(completeDrop(result));
    expect(hooks.onDragEnd).toHaveBeenCalledTimes(1);
    hooks.onDragEnd.mockReset();

    // abort
    store.dispatch(clean());
    expect(hooks.onDragEnd).not.toHaveBeenCalled();
  });
});

describe('subsequent drags', () => {
  it('should behave correctly across multiple drags', () => {
    const hooks: Hooks = createHooks();
    const store = createStore(
      middleware(() => hooks, getAnnounce())
    );
    Array.from({ length: 4 }).forEach(() => {
      // start
      store.dispatch(prepare());
      store.dispatch(initialPublish(initialPublishArgs));
      expect(hooks.onDragStart).toHaveBeenCalledWith(
        getDragStart(initialPublishArgs.critical),
        expect.any(Object),
      );
      expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

      // update
      const update: DragUpdate = {
        ...getDragStart(initialPublishArgs.critical),
        destination: {
          droppableId: initialPublishArgs.critical.droppable.id,
          index: initialPublishArgs.critical.draggable.index + 1,
        },
      };
      store.dispatch(bulkReplace(initialBulkReplaceArgs));
      store.dispatch(moveForward());
      expect(hooks.onDragUpdate).toHaveBeenCalledWith(update, expect.any(Object));
      expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);

      // drop
      const result: DropResult = {
        ...update,
        reason: 'DROP',
      };
      store.dispatch(completeDrop(result));
      expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
      expect(hooks.onDragEnd).toHaveBeenCalledTimes(1);

      // cleanup
      store.dispatch(clean());
      // $ExpectError - unknown mock reset property
      hooks.onDragStart.mockReset();
      // $ExpectError - unknown mock reset property
      hooks.onDragUpdate.mockReset();
      // $ExpectError - unknown mock reset property
      hooks.onDragEnd.mockReset();
    });
  });
});

type Case = {|
  title: 'onDragStart' | 'onDragUpdate' | 'onDragEnd',
  execute: (store: Store) => void,
  defaultMessage: string,
|}

describe('announcements', () => {
  const moveForwardUpdate: DragUpdate = {
    ...getDragStart(initialPublishArgs.critical),
    destination: {
      droppableId: initialPublishArgs.critical.droppable.id,
      index: initialPublishArgs.critical.draggable.index + 1,
    },
  };

  const cases: Case[] = [
    {
      title: 'onDragStart',
      execute: (store: Store) => {
        store.dispatch(prepare());
        store.dispatch(initialPublish(initialPublishArgs));
      },
      defaultMessage: messagePreset.onDragStart(getDragStart(initialPublishArgs.critical)),
    },
    {
      title: 'onDragUpdate',
      execute: (store: Store) => {
        store.dispatch(prepare());
        store.dispatch(initialPublish(initialPublishArgs));
        store.dispatch(bulkReplace(initialBulkReplaceArgs));
        store.dispatch(moveForward());
      },
      defaultMessage: messagePreset.onDragUpdate(moveForwardUpdate),
    },
    {
      title: 'onDragEnd',
      execute: (store: Store) => {
        store.dispatch(prepare());
        store.dispatch(initialPublish(initialPublishArgs));
        store.dispatch(bulkReplace(initialBulkReplaceArgs));
        store.dispatch(moveForward());

        const result: DropResult = {
          ...moveForwardUpdate,
          reason: 'DROP',
        };
        store.dispatch(completeDrop(result));
      },
      defaultMessage: messagePreset.onDragEnd({
        ...moveForwardUpdate,
        reason: 'DROP',
      }),
    },
  ];

  cases.forEach((current: Case) => {
    describe(`for hook: ${current.title}`, () => {
      let hooks: Hooks;
      let announce: Announce;
      let store: Store;

      beforeEach(() => {
        hooks = createHooks();
        announce = getAnnounce();
        store = createStore(
          middleware(() => hooks, announce)
        );
      });

      it('should announce with the default message if no hook is provided', () => {
        // This test is not relevant for onDragEnd as it must always be provided
        if (current.title === 'onDragEnd') {
          return;
        }
        // unsetting hook
        hooks[current.title] = undefined;
        current.execute(store);
        expect(announce).toHaveBeenCalledWith(current.defaultMessage);
      });

      it('should announce with the default message if the hook does not announce', () => {
        current.execute(store);
        expect(announce).toHaveBeenCalledWith(current.defaultMessage);
      });

      it('should not announce twice if the hook makes an announcement', () => {
        // $ExpectError - property does not exist on hook property
        hooks[current.title] = jest.fn((data: any, provided: HookProvided) => {
          announce.mockReset();
          provided.announce('hello');
          expect(announce).toHaveBeenCalledWith('hello');
          // asserting there was no double call
          expect(announce).toHaveBeenCalledTimes(1);
        });

        current.execute(store);
      });

      it('should prevent async announcements', () => {
        jest.useFakeTimers();
        jest.spyOn(console, 'warn').mockImplementation(() => { });

        let provided: HookProvided;
        // $ExpectError - property does not exist on hook property
        hooks[current.title] = jest.fn((data: any, supplied: HookProvided) => {
          announce.mockReset();
          provided = supplied;
        });

        current.execute(store);

        // We did not announce so it would have been called with the default message
        expect(announce).toHaveBeenCalledWith(current.defaultMessage);
        expect(announce).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();
        announce.mockReset();

        // perform an async message
        setTimeout(() => provided.announce('async message'));
        jest.runOnlyPendingTimers();

        expect(announce).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalled();

        // cleanup
        jest.useRealTimers();
        console.warn.mockRestore();
      });

      it('should prevent multiple announcement calls from a consumer', () => {
        jest.spyOn(console, 'warn').mockImplementation(() => { });

        let provided: HookProvided;
        // $ExpectError - property does not exist on hook property
        hooks[current.title] = jest.fn((data: any, supplied: HookProvided) => {
          announce.mockReset();
          provided = supplied;
          provided.announce('hello');
        });

        current.execute(store);

        expect(announce).toHaveBeenCalledWith('hello');
        expect(announce).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();
        announce.mockReset();

        // perform another announcement
        invariant(provided, 'provided is not set');
        provided.announce('another one');

        expect(announce).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalled();

        console.warn.mockRestore();
      });
    });
  });
});
