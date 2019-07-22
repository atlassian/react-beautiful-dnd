// @flow
import invariant from 'tiny-invariant';
import type { State } from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import middleware from '../../../../../src/state/middleware/drop/drop-animation-finish-middleware';
import dropMiddleware from '../../../../../src/state/middleware/drop/drop-middleware';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import { add } from '../../../../../src/state/position';
import {
  initialPublish,
  completeDrop,
  move,
  dropAnimationFinished,
  drop,
} from '../../../../../src/state/action-creators';
import {
  initialPublishArgs,
  getCompletedArgs,
} from '../../../../utils/preset-action-args';

it('should fire a complete drop action when a drop animation finish action is fired', () => {
  const mock = jest.fn();

  const store: Store = createStore(
    passThrough(mock),
    // will convert the drop into a drop animate
    dropMiddleware,
    middleware,
  );

  store.dispatch(initialPublish(initialPublishArgs));

  expect(store.getState().phase).toBe('DRAGGING');

  // A small movement so a drop animation will be needed
  store.dispatch(
    move({
      client: add(initialPublishArgs.clientSelection, { x: 1, y: 1 }),
    }),
  );
  store.dispatch(drop({ reason: 'DROP' }));

  const state: State = store.getState();
  invariant(
    state.phase === 'DROP_ANIMATING',
    `Incorrect phase: ${state.phase}`,
  );

  mock.mockReset();
  store.dispatch(dropAnimationFinished());
  expect(mock).toHaveBeenCalledWith(dropAnimationFinished());

  expect(mock).toHaveBeenCalledWith(completeDrop(getCompletedArgs('DROP')));
  expect(mock).toHaveBeenCalledTimes(2);
});

it('should throw if a drop animation finished action occurs while not in the drop animating phase', () => {
  const store: Store = createStore(middleware);

  expect(() => store.dispatch(dropAnimationFinished())).toThrow();
});
