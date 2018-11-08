// @flow
import invariant from 'tiny-invariant';
import {
  completeDrop,
  initialPublish,
  moveDown,
  updateDroppableIsCombineEnabled,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/handles';
import messagePreset from '../../../../../src/state/middleware/util/screen-reader-message-preset';
import {
  preset,
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import type {
  Handles,
  Announce,
  DragUpdate,
  DropResult,
  HandleProvided,
} from '../../../../../src/types';
import type { Store, Dispatch } from '../../../../../src/state/store-types';
import createHandles from './util/get-handles-stub';
import getAnnounce from './util/get-announce-stub';

jest.useFakeTimers();

type Case = {|
  handle: 'onDragStart' | 'onDragUpdate' | 'onDragEnd',
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
  // release async handle
  jest.runOnlyPendingTimers();
};

const update = (dispatch: Dispatch) => {
  dispatch(moveDown());
  // release async handle
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
    handle: 'onDragStart',
    execute: (store: Store) => {
      start(store.dispatch);
    },
    defaultMessage: messagePreset.onDragStart(getDragStart()),
  },
  {
    // a reorder upate
    handle: 'onDragUpdate',
    description: 'a reorder update',
    execute: (store: Store) => {
      start(store.dispatch);
      update(store.dispatch);
    },
    defaultMessage: messagePreset.onDragUpdate(moveForwardUpdate),
  },
  {
    // a combine update
    handle: 'onDragUpdate',
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
    handle: 'onDragEnd',
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
  describe(`for handle: ${current.handle}${
    current.description ? `: ${current.description}` : ''
  }`, () => {
    let handles: Handles;
    let announce: Announce;
    let store: Store;

    beforeEach(() => {
      handles = createHandles();
      announce = getAnnounce();
      store = createStore(middleware(() => handles, announce));
    });

    it('should announce with the default message if no handle is provided', () => {
      // This test is not relevant for onDragEnd as it must always be provided
      if (current.handle === 'onDragEnd') {
        return;
      }
      // unsetting handle
      handles[current.handle] = undefined;
      current.execute(store);
      expect(announce).toHaveBeenCalledWith(current.defaultMessage);
    });

    it('should announce with the default message if the handle does not announce', () => {
      current.execute(store);
      expect(announce).toHaveBeenCalledWith(current.defaultMessage);
    });

    it('should not announce twice if the handle makes an announcement', () => {
      // $ExpectError - property does not exist on handle property
      handles[current.handle] = jest.fn(
        (data: any, provided: HandleProvided) => {
          announce.mockReset();
          provided.announce('hello');
          expect(announce).toHaveBeenCalledWith('hello');
          // asserting there was no double call
          expect(announce).toHaveBeenCalledTimes(1);
        },
      );

      current.execute(store);
    });

    it('should prevent async announcements', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      let provided: HandleProvided;
      // $ExpectError - property does not exist on handle property
      handles[current.handle] = jest.fn(
        (data: any, supplied: HandleProvided) => {
          announce.mockReset();
          provided = supplied;
        },
      );

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

      let provided: HandleProvided;
      // $ExpectError - property does not exist on handle property
      handles[current.handle] = jest.fn(
        (data: any, supplied: HandleProvided) => {
          announce.mockReset();
          provided = supplied;
          provided.announce('hello');
        },
      );

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
