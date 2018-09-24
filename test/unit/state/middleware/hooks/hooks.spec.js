// @flow
import invariant from 'tiny-invariant';
import middleware from '../../../../../src/state/middleware/hooks';
import messagePreset from '../../../../../src/state/middleware/util/message-preset';
import { add } from '../../../../../src/state/position';
import {
  clean,
  initialPublish,
  completeDrop,
  moveDown,
  moveUp,
  move,
  publish,
  collectionStarting,
  type MoveArgs,
  type InitialPublishArgs,
} from '../../../../../src/state/action-creators';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import { getPreset, makeScrollable } from '../../../../utils/dimension';
import {
  initialPublishArgs,
  initialPublishWithScrollables,
  getDragStart,
  publishAdditionArgs,
} from '../../../../utils/preset-action-args';
import type {
  DraggableLocation,
  Hooks,
  State,
  Announce,
  DragUpdate,
  DropResult,
  HookProvided,
  Published,
  DragStart,
  DroppableDimension,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';

const preset = getPreset();

const createHooks = (): Hooks => ({
  onBeforeDragStart: jest.fn(),
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

const getAnnounce = (): Announce => jest.fn();

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
