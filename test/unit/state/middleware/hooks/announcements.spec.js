// @flow
import invariant from 'tiny-invariant';
import {
  completeDrop,
  initialPublish,
  moveDown,
  updateDroppableIsCombineEnabled,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/hooks';
import messagePreset from '../../../../../src/state/middleware/util/screen-reader-message-preset';
import {
  preset,
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import type {
  Hooks,
  Announce,
  DragUpdate,
  DropResult,
  HookProvided,
} from '../../../../../src/types';
import type { Store, Dispatch } from '../../../../../src/state/store-types';
import createHooks from './util/get-hooks-stub';
import getAnnounce from './util/get-announce-stub';

jest.useFakeTimers();

type Case = {|
  hook: 'onDragStart' | 'onDragUpdate' | 'onDragEnd',
  description?: string,
  execute: (store: Store) => void,
  defaultMessage: string,
|};

const moveForwardUpdate: DragUpdate = {
  ...getDragStart(),
  destination: {
    droppableId: initialPublishArgs.critical.droppable.id,
    index: initialPublishArgs.critical.draggable.index + 1,
  },
  combine: null,
};

const combineUpdate: DragUpdate = {
  ...getDragStart(),
  destination: null,
  combine: {
    draggableId: preset.inHome2.descriptor.id,
    droppableId: initialPublishArgs.critical.droppable.id,
  },
};

const start = (dispatch: Dispatch) => {
  dispatch(initialPublish(initialPublishArgs));
  // release async hook
  jest.runOnlyPendingTimers();
};

const update = (dispatch: Dispatch) => {
  dispatch(moveDown());
  // release async hook
  jest.runOnlyPendingTimers();
};

const end = (dispatch: Dispatch) => {
  const result: DropResult = {
    ...moveForwardUpdate,
    reason: 'DROP',
  };
  dispatch(completeDrop(result));
};

const cases: Case[] = [
  {
    hook: 'onDragStart',
    execute: (store: Store) => {
      start(store.dispatch);
    },
    defaultMessage: messagePreset.onDragStart(getDragStart()),
  },
  {
    // a reorder upate
    hook: 'onDragUpdate',
    description: 'a reorder update',
    execute: (store: Store) => {
      start(store.dispatch);
      update(store.dispatch);
    },
    defaultMessage: messagePreset.onDragUpdate(moveForwardUpdate),
  },
  {
    // a combine update
    hook: 'onDragUpdate',
    description: 'a combine update',
    execute: (store: Store) => {
      start(store.dispatch);
      store.dispatch(
        updateDroppableIsCombineEnabled({
          id: initialPublishArgs.critical.droppable.id,
          isCombineEnabled: true,
        }),
      );
      update(store.dispatch);
    },
    defaultMessage: messagePreset.onDragUpdate(combineUpdate),
  },
  {
    hook: 'onDragEnd',
    execute: (store: Store) => {
      start(store.dispatch);
      update(store.dispatch);
      end(store.dispatch);
    },
    defaultMessage: messagePreset.onDragEnd({
      ...moveForwardUpdate,
      reason: 'DROP',
    }),
  },
];

cases.forEach((current: Case) => {
  describe(`for hook: ${current.hook}${
    current.description ? `: ${current.description}` : ''
  }`, () => {
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
      if (current.hook === 'onDragEnd') {
        return;
      }
      // unsetting hook
      hooks[current.hook] = undefined;
      current.execute(store);
      expect(announce).toHaveBeenCalledWith(current.defaultMessage);
    });

    it('should announce with the default message if the hook does not announce', () => {
      current.execute(store);
      expect(announce).toHaveBeenCalledWith(current.defaultMessage);
    });

    it('should not announce twice if the hook makes an announcement', () => {
      // $ExpectError - property does not exist on hook property
      hooks[current.hook] = jest.fn((data: any, provided: HookProvided) => {
        announce.mockReset();
        provided.announce('hello');
        expect(announce).toHaveBeenCalledWith('hello');
        // asserting there was no double call
        expect(announce).toHaveBeenCalledTimes(1);
      });

      current.execute(store);
    });

    it('should prevent async announcements', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      let provided: HookProvided;
      // $ExpectError - property does not exist on hook property
      hooks[current.hook] = jest.fn((data: any, supplied: HookProvided) => {
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
      console.warn.mockRestore();
    });

    it('should prevent multiple announcement calls from a consumer', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      let provided: HookProvided;
      // $ExpectError - property does not exist on hook property
      hooks[current.hook] = jest.fn((data: any, supplied: HookProvided) => {
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
