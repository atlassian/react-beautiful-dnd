// @flow
import invariant from 'tiny-invariant';
import {
  clean,
  collectionStarting,
  drop,
  dropPending,
  initialPublish,
  move,
} from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/drop';
import { add } from '../../../../../src/state/position';
import { initialPublishArgs } from '../../../../util/preset-action-args';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import type { State } from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';

it('should throw an error if a drop action occurs while not in a phase where you can drop', () => {
  const store: Store = createStore(middleware);

  // idle (it is okay to perform a defensive drop here)
  // this can happen during an exception flow
  expect(() => {
    store.dispatch(drop({ reason: 'DROP' }));
  }).not.toThrow();

  // drop animating
  store.dispatch(clean());
  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');

  // moving a little bit so that a drop animation will be needed
  store.dispatch(
    move({
      client: add(initialPublishArgs.clientSelection, { x: 1, y: 1 }),
    }),
  );

  store.dispatch(drop({ reason: 'DROP' }));
  expect(store.getState().phase).toBe('DROP_ANIMATING');

  expect(() => store.dispatch(drop({ reason: 'DROP' }))).toThrow();
});

it('should dispatch a DROP_PENDING action if COLLECTING', () => {
  const mock = jest.fn();
  const store: Store = createStore(passThrough(mock), middleware);

  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  store.dispatch(collectionStarting());

  // now in the bulk collecting phase
  expect(store.getState().phase).toBe('COLLECTING');
  mock.mockReset();

  // drop
  store.dispatch(drop({ reason: 'DROP' }));

  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledWith(dropPending({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledTimes(2);
  expect(store.getState().phase).toBe('DROP_PENDING');
});

it('should throw if a drop action is fired and there is DROP_PENDING and it is waiting for a publish', () => {
  const mock = jest.fn();
  const store: Store = createStore(passThrough(mock), middleware);

  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(collectionStarting());

  // now in the bulk collecting phase
  expect(store.getState().phase).toBe('COLLECTING');
  mock.mockReset();

  // drop moving to drop pending
  store.dispatch(drop({ reason: 'DROP' }));
  expect(mock).toHaveBeenCalledWith(dropPending({ reason: 'DROP' }));

  const state: State = store.getState();
  invariant(state.phase === 'DROP_PENDING', 'invalid phase');

  expect(state.isWaiting).toBe(true);

  // Drop action being fired (should not happen?)

  expect(() => store.dispatch(drop({ reason: 'DROP' }))).toThrow(
    'A DROP action occurred while DROP_PENDING and still waiting',
  );
});
