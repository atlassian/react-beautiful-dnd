// @flow
import invariant from 'tiny-invariant';
import middleware from '../../../../src/state/middleware/hooks';
import messagePreset from '../../../../src/state/middleware/util/message-preset';
import { add } from '../../../../src/state/position';
import {
  clean,
  prepare,
  initialPublish,
  completeDrop,
  moveDown,
  moveUp,
  move,
  publish,
  collectionStarting,
  type MoveArgs,
  type InitialPublishArgs,
  type Action,
} from '../../../../src/state/action-creators';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import { getPreset } from '../../../utils/dimension';
import {
  initialPublishArgs,
  getDragStart,
  publishAdditionArgs,
} from '../../../utils/preset-action-args';
import type {
  DraggableLocation,
  Hooks,
  State,
  Announce,
  DragUpdate,
  DropResult,
  HookProvided,
  Publish,
  DragStart,
} from '../../../../src/types';
import type { Store } from '../../../../src/state/store-types';

const preset = getPreset();

const createHooks = (): Hooks => ({
  onBeforeDragStart: jest.fn(),
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

const getAnnounce = (): Announce => jest.fn();

describe('start', () => {
  it('should call the onDragStart hook when a initial publish occurs', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    // prepare step should not trigger hook
    store.dispatch(prepare());
    expect(hooks.onDragStart).not.toHaveBeenCalled();

    // first initial publish
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledWith(
      getDragStart(),
      expect.any(Object),
    );
  });

  it('should call the onBeforeDragState and onDragStart in the correct order', () => {
    let mockCalled: ?number = null;
    let onBeforeDragStartCalled: ?number = null;
    let onDragStartCalled: ?number = null;
    const mock = jest.fn().mockImplementation(() => {
      mockCalled = performance.now();
    });
    const hooks: Hooks = createHooks();
    // $FlowFixMe - no property mockImplementation
    hooks.onBeforeDragStart.mockImplementation(() => {
      onBeforeDragStartCalled = performance.now();
    });
    // $FlowFixMe - no property mockImplementation
    hooks.onDragStart.mockImplementation(() => {
      onDragStartCalled = performance.now();
    });
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce()),
      passThrough(mock),
    );

    // prepare step should not trigger hook
    store.dispatch(prepare());
    expect(hooks.onBeforeDragStart).not.toHaveBeenCalled();
    mock.mockClear();
    mockCalled = null;

    // first initial publish
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onBeforeDragStart).toHaveBeenCalledWith(getDragStart());

    // checking the order
    invariant(onBeforeDragStartCalled);
    invariant(mockCalled);
    invariant(onDragStartCalled);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(onBeforeDragStartCalled).toBeLessThan(mockCalled);
    expect(mockCalled).toBeLessThan(onDragStartCalled);
  });

  it('should throw an exception if an initial publish is called before a drag ends', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

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
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

    const result: DropResult = {
      ...getDragStart(),
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
        index: 2,
      },
      reason: 'DROP',
    };
    store.dispatch(completeDrop(result));
    expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
  });

  it('should throw an exception if there was no drag start published', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    const result: DropResult = {
      ...getDragStart(),
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
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
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    // Okay let's move it
    store.dispatch(moveDown());
    const update: DragUpdate = {
      ...getDragStart(),
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
        index: initialPublishArgs.critical.draggable.index + 1,
      },
    };
    expect(hooks.onDragUpdate).toHaveBeenCalledWith(update, expect.any(Object));
  });

  it('should not call onDragUpdate if there is no movement from the last update', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
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
    store.dispatch(moveDown());
    expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);

    const state: State = store.getState();
    invariant(
      state.phase === 'DRAGGING',
      'Expecting state to be in dragging phase',
    );

    // A small movement that should not trigger any index changes
    store.dispatch(
      move({
        client: add(state.current.client.selection, { x: -1, y: -1 }),
        shouldAnimate: true,
      }),
    );

    expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
  });

  // TODO: enable when we use dynamic dimensions
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('updates caused by dynamic changes', () => {
    it('should not call onDragUpdate if the destination or source have not changed', () => {
      const hooks: Hooks = createHooks();
      const store: Store = createStore(middleware(() => hooks, getAnnounce()));

      store.dispatch(prepare());
      store.dispatch(initialPublish(initialPublishArgs));
      expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
      expect(hooks.onDragUpdate).not.toHaveBeenCalled();

      store.dispatch(collectionStarting());
      store.dispatch(publish(publishAdditionArgs));
      // not called yet as position has not changed
      expect(hooks.onDragUpdate).not.toHaveBeenCalled();
    });

    it('should call onDragUpdate if the source has changed - even if the destination has not changed', () => {
      // - dragging inHome2 with no impact
      // - inHome1 is removed
      const hooks: Hooks = createHooks();
      const store: Store = createStore(middleware(() => hooks, getAnnounce()));
      // dragging inHome2 with no impact
      const customInitial: InitialPublishArgs = {
        critical: {
          draggable: preset.inHome2.descriptor,
          droppable: preset.home.descriptor,
        },
        dimensions: preset.dimensions,
        client: {
          selection: preset.inHome2.client.borderBox.center,
          borderBoxCenter: preset.inHome2.client.borderBox.center,
          offset: { x: 0, y: 0 },
        },
        viewport: preset.viewport,
        autoScrollMode: 'FLUID',
      };

      store.dispatch(prepare());
      store.dispatch(initialPublish(customInitial));
      const start: DragStart = {
        draggableId: preset.inHome2.descriptor.id,
        type: preset.home.descriptor.type,
        source: {
          droppableId: preset.home.descriptor.id,
          index: 1,
        },
      };
      expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
      expect(hooks.onDragStart).toHaveBeenCalledWith(start, expect.any(Object));
      expect(hooks.onDragUpdate).not.toHaveBeenCalled();

      // first move down
      store.dispatch(moveDown());
      expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
      // $ExpectError - unknown mock reset property
      hooks.onDragUpdate.mockReset();

      // move up into the original position
      store.dispatch(moveUp());
      // no current displacement
      {
        const current: State = store.getState();
        invariant(current.impact);
        expect(current.impact.movement.displaced).toEqual([]);
      }
      const lastUpdate: DragUpdate = {
        draggableId: preset.inHome2.descriptor.id,
        type: preset.home.descriptor.type,
        source: {
          droppableId: preset.home.descriptor.id,
          index: 1,
        },
        // back in the home location
        destination: {
          droppableId: preset.home.descriptor.id,
          index: 1,
        },
      };
      expect(hooks.onDragUpdate).toHaveBeenCalledWith(
        lastUpdate,
        expect.any(Object),
      );
      expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
      // $ExpectError - unknown mock reset property
      hooks.onDragUpdate.mockReset();

      // removing inHome1
      const customPublish: Publish = {
        removals: {
          draggables: [preset.inHome1.descriptor.id],
          droppables: [],
        },
        additions: {
          draggables: [],
          droppables: [],
        },
      };

      store.dispatch(collectionStarting());
      store.dispatch(publish(customPublish));

      const postPublishUpdate: DragUpdate = {
        draggableId: preset.inHome2.descriptor.id,
        type: preset.home.descriptor.type,
        // new source as inHome1 was removed
        source: {
          droppableId: preset.home.descriptor.id,
          index: 0,
        },
        // destination has not changed from last update
        destination: lastUpdate.destination,
      };
      expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
      expect(hooks.onDragUpdate).toHaveBeenCalledWith(
        postPublishUpdate,
        expect.any(Object),
      );
    });
  });
});

describe('abort', () => {
  it('should not do anything if a drag had not started', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

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
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    store.dispatch(clean());
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalled();

    store.dispatch(clean());
    const expected: DropResult = {
      ...getDragStart(),
      destination: null,
      reason: 'CANCEL',
    };
    expect(hooks.onDragEnd).toHaveBeenCalledWith(expected, expect.any(Object));
  });

  it('should publish an onDragEnd with no destination even if there is a current destination', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    store.dispatch(clean());
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));

    const state: State = store.getState();
    invariant(state.phase === 'DRAGGING');
    // in home location
    const home: DraggableLocation = {
      droppableId: initialPublishArgs.critical.droppable.id,
      index: initialPublishArgs.critical.draggable.index,
    };
    expect(state.impact.destination).toEqual(home);

    store.dispatch(clean());
    const expected: DropResult = {
      ...getDragStart(),
      // destination has been cleared
      destination: null,
      reason: 'CANCEL',
    };
    expect(hooks.onDragEnd).toHaveBeenCalledWith(expected, expect.any(Object));
  });

  it('should not publish an onDragEnd if aborted after a drop', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(middleware(() => hooks, getAnnounce()));

    // lift
    store.dispatch(clean());
    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalled();

    // drop
    const result: DropResult = {
      ...getDragStart(),
      destination: null,
      reason: 'CANCEL',
    };
    store.dispatch(completeDrop(result));
    expect(hooks.onDragEnd).toHaveBeenCalledTimes(1);
    // $ExpectError - unknown mock reset property
    hooks.onDragEnd.mockReset();

    // abort
    store.dispatch(clean());
    expect(hooks.onDragEnd).not.toHaveBeenCalled();
  });
});

describe('subsequent drags', () => {
  it('should behave correctly across multiple drags', () => {
    const hooks: Hooks = createHooks();
    const store = createStore(middleware(() => hooks, getAnnounce()));
    Array.from({ length: 4 }).forEach(() => {
      // start
      store.dispatch(prepare());
      store.dispatch(initialPublish(initialPublishArgs));
      expect(hooks.onDragStart).toHaveBeenCalledWith(
        getDragStart(),
        expect.any(Object),
      );
      expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

      // update
      const update: DragUpdate = {
        ...getDragStart(),
        destination: {
          droppableId: initialPublishArgs.critical.droppable.id,
          index: initialPublishArgs.critical.draggable.index + 1,
        },
      };
      store.dispatch(moveDown());
      expect(hooks.onDragUpdate).toHaveBeenCalledWith(
        update,
        expect.any(Object),
      );
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
|};

describe('announcements', () => {
  const moveForwardUpdate: DragUpdate = {
    ...getDragStart(),
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
      defaultMessage: messagePreset.onDragStart(getDragStart()),
    },
    {
      title: 'onDragUpdate',
      execute: (store: Store) => {
        store.dispatch(prepare());
        store.dispatch(initialPublish(initialPublishArgs));
        store.dispatch(moveDown());
      },
      defaultMessage: messagePreset.onDragUpdate(moveForwardUpdate),
    },
    {
      title: 'onDragEnd',
      execute: (store: Store) => {
        store.dispatch(prepare());
        store.dispatch(initialPublish(initialPublishArgs));
        store.dispatch(moveDown());

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
        store = createStore(middleware(() => hooks, announce));
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
        jest.spyOn(console, 'warn').mockImplementation(() => {});

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
        jest.spyOn(console, 'warn').mockImplementation(() => {});

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
