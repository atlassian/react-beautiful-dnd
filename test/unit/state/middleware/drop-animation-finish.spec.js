// @flow
import invariant from 'tiny-invariant';
import type { Store, DropResult, State } from '../../../../src/types';
import middleware from '../../../../src/state/middleware/drop-animation-finish';
import dropMiddleware from '../../../../src/state/middleware/drop';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import { add } from '../../../../src/state/position';
import {
  prepare,
  initialPublish,
  completeDrop,
  bulkReplace,
  move,
  dropAnimationFinished,
  drop,
} from '../../../../src/state/action-creators';
import { initialPublishArgs, initialBulkReplaceArgs } from './util/preset-action-args';

it('should fire a complete drop action when a drop animation finish action is fired', () => {
  const mock = jest.fn();

  const store: Store = createStore(
    passThrough(mock),
    // will convert the drop into a drop animate
    dropMiddleware,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(bulkReplace(initialBulkReplaceArgs));

  expect(store.getState().phase).toBe('DRAGGING');

  // A small movement so a drop animation will be needed
  store.dispatch(move({
    client: add(initialPublishArgs.client.selection, { x: 1, y: 1 }),
    shouldAnimate: true,
  }));
  store.dispatch(drop({ reason: 'DROP' }));

  const state: State = store.getState();
  invariant(state.phase === 'DROP_ANIMATING', `Incorrect phase: ${state.phase}`);
  const result: DropResult = state.pending.result;

  mock.mockReset();
  store.dispatch(dropAnimationFinished());
  expect(mock).toHaveBeenCalledWith(dropAnimationFinished());

  expect(mock).toHaveBeenCalledWith(completeDrop(result));
  expect(mock).toHaveBeenCalledTimes(2);
});

it('should throw if a drop animation finished action occurs while not in the drop animating phase', () => {
  const store: Store = createStore(
    middleware,
  );

  expect(() => store.dispatch(dropAnimationFinished())).toThrow();
});
