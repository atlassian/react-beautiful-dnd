// @flow
import type { State } from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import { invariant } from '../../../../../src/invariant';
import middleware from '../../../../../src/state/middleware/drop/drop-animation-flush-on-scroll-middleware';
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
  flush,
  type Action,
} from '../../../../../src/state/action-creators';
import {
  initialPublishArgs,
  getCompletedArgs,
} from '../../../../util/preset-action-args';

function getToDropAnimation(mock: JestMockFn<*, *>): Store {
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

  return store;
}

it('should clear any running drop is a scroll event occurs', () => {
  const mock = jest.fn();
  getToDropAnimation(mock);

  mock.mockReset();
  // waiting for an animation frame before any scroll events would cancel a drag
  window.dispatchEvent(new Event('scroll'));
  expect(mock).not.toHaveBeenCalled();

  // after an animation frame, we should be in business
  requestAnimationFrame.step();
  window.dispatchEvent(new Event('scroll'));

  expect(mock).toHaveBeenCalledWith(dropAnimationFinished());
  expect(mock).toHaveBeenCalledTimes(1);
});

it('should only try to clear once', () => {
  const mock = jest.fn();
  getToDropAnimation(mock);

  mock.mockReset();

  // after an animation frame, we should be in business
  requestAnimationFrame.step();
  window.dispatchEvent(new Event('scroll'));
  window.dispatchEvent(new Event('scroll'));

  expect(mock).toHaveBeenCalledWith(dropAnimationFinished());
  expect(mock).toHaveBeenCalledTimes(1);
});

it('should not try to cancel a drop animation if the drop finished', () => {
  [
    flush(),
    completeDrop(getCompletedArgs('DROP')),
    dropAnimationFinished(),
  ].forEach((action: Action) => {
    const mock = jest.fn();
    const store: Store = getToDropAnimation(mock);

    store.dispatch(action);
    mock.mockClear();

    // would normally trigger a dropAnimationFinished
    requestAnimationFrame.step();
    window.dispatchEvent(new Event('scroll'));

    expect(mock).not.toHaveBeenCalled();
  });
});
