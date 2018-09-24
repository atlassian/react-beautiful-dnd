// @flow
import invariant from 'tiny-invariant';
import {
  clean,
  completeDrop,
  initialPublish,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/hooks';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import getAnnounce from './util/get-announce-stub';
import createHooks from './util/get-hooks-stub';
import type {
  DraggableLocation,
  Hooks,
  State,
  DropResult,
} from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';

it('should call onDragEnd with the last published critical descriptor', () => {
  const hooks: Hooks = createHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  requestAnimationFrame.step();
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

  store.dispatch(clean());
  const expected: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  expect(hooks.onDragEnd).toHaveBeenCalledWith(expected, expect.any(Object));
});

it('should publish an onDragEnd with no destination even if there is a current destination', () => {
  const hooks: Hooks = createHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  requestAnimationFrame.step();

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
    combine: null,
    reason: 'CANCEL',
  };
  expect(hooks.onDragEnd).toHaveBeenCalledWith(expected, expect.any(Object));
});

it('should not publish an onDragEnd if aborted after a drop', () => {
  const hooks: Hooks = createHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  // lift
  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  requestAnimationFrame.step();
  expect(hooks.onDragStart).toHaveBeenCalled();

  // drop
  const result: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
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

it('should publish an on drag end if aborted before the publish of an onDragStart', () => {
  const hooks: Hooks = createHooks();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  // lift
  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  // onDragStart not flushed yet
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  // drop
  const result: DropResult = {
    ...getDragStart(),
    destination: null,
    combine: null,
    reason: 'CANCEL',
  };
  store.dispatch(completeDrop(result));
  expect(hooks.onDragEnd).toHaveBeenCalledTimes(1);

  // validation - onDragStart has been flushed
  expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
});
