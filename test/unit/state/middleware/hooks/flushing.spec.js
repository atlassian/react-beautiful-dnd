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
  moveDown,
  moveUp,
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

it('should trigger an on drag start after in the next cycle', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
});

it('should queue a drag start if an action comes in while the timeout is pending', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();

  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
});

it('should flush any pending hooks if a drop occurs', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onDragStart).not.toHaveBeenCalled();
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(hooks.onDragStart).not.toHaveBeenCalled();
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(moveUp());
  expect(hooks.onDragStart).not.toHaveBeenCalled();
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(completeDrop(result));
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(2);
  expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should work across multiple drags', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));
  Array.from({ length: 4 }).forEach(() => {
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onBeforeDragStart).toHaveBeenCalled();
    expect(hooks.onDragStart).not.toHaveBeenCalled();

    store.dispatch(moveDown());
    expect(hooks.onDragStart).not.toHaveBeenCalled();
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(completeDrop(result));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
    expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));

    // $FlowFixMe - hook does not have mockReset property
    hooks.onDragStart.mockReset();
    // $FlowFixMe - hook does not have mockReset property
    hooks.onDragUpdate.mockReset();
    // $FlowFixMe - hook does not have mockReset property
    hooks.onDragEnd.mockReset();
  });
});
