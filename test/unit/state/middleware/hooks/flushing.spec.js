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

it('should trigger an on drag start after an animation frame', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  requestAnimationFrame.step();
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
});

it('should flush a drag start if an action comes in while the frame is pending', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
});

it('should flush a drag start if a drop occurs', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  store.dispatch(completeDrop(result));
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
  expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
});

it('should trigger an on drag update after an animation frame', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));

  store.dispatch(moveDown());
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  requestAnimationFrame.step();
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);
});

it('should flush a drag update if another update comes in', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));

  // first not called
  store.dispatch(moveDown());
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  // flushing first
  store.dispatch(moveDown());
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(1);

  // flushing second
  store.dispatch(moveDown());
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(2);

  // flushing third
  requestAnimationFrame.step();
  expect(hooks.onDragUpdate).toHaveBeenCalledTimes(3);
});

it('should flush a drag update if a drop occurs', () => {
  const hooks: Hooks = getHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(initialPublish(initialPublishArgs));

  store.dispatch(moveDown());
  expect(hooks.onDragUpdate).not.toHaveBeenCalled();

  store.dispatch(completeDrop(result));
  // update flushed
  expect(hooks.onDragUpdate).toHaveBeenCalled();
  // drop occurred without flushing
  expect(hooks.onDragEnd).toHaveBeenCalled();
});
