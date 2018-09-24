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
import createHooks from './util/get-hooks-stub';
import getAnnounce from './util/get-announce-stub';

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
