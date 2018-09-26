// @flow
import middleware from '../../../../../src/state/middleware/hooks';
import createStore from '../util/create-store';
import type { Hooks, DropResult } from '../../../../../src/types';
import {
  initialPublishArgs,
  getDragStart,
} from '../../../../utils/preset-action-args';
import {
  initialPublish,
  completeDrop,
} from '../../../../../src/state/action-creators';
import type { Store } from '../../../../../src/state/store-types';
import getHooks from './util/get-hooks-stub';
import getAnnounce from './util/get-announce-stub';

const result: DropResult = {
  ...getDragStart(),
  destination: {
    droppableId: initialPublishArgs.critical.droppable.id,
    index: 2,
  },
  combine: null,
  reason: 'DROP',
};

jest.useFakeTimers();

it('should call the onDragEnd hook when a DROP_COMPLETE action occurs', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  jest.runOnlyPendingTimers();
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

  store.dispatch(completeDrop(result));
  expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should throw an exception if there was no drag start published', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  // throws when in idle
  expect(() => store.dispatch(completeDrop(result))).toThrow();
});
