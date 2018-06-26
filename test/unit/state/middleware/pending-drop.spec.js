// @flow
import invariant from 'tiny-invariant';
import type { Store, State, DropResult } from '../../../../src/types';
import middleware from '../../../../src/state/middleware/pending-drop';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import dropMiddleware from '../../../../src/state/middleware/drop';
import getHomeLocation from '../../../../src/state/get-home-location';
import {
  prepare,
  initialPublish,
  drop,
  completeDrop,
  publish,
  collectionStarting,
} from '../../../../src/state/action-creators';
import {
  initialPublishArgs,
  getDragStart,
  critical,
  publishAdditionArgs,
} from '../../../utils/preset-action-args';

it('should trigger a drop on a bulk replace if a drop pending is waiting', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    // will fire the pending drop action
    dropMiddleware,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(collectionStarting());
  store.dispatch(drop({ reason: 'DROP' }));

  const postDrop: State = store.getState();
  invariant(
    postDrop.phase === 'DROP_PENDING',
    `Incorrect phase : ${postDrop.phase}`,
  );
  expect(postDrop.isWaiting).toBe(true);

  // This will finish the drag
  mock.mockReset();
  store.dispatch(publish(publishAdditionArgs));

  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
  const expected: DropResult = {
    ...getDragStart(),
    destination: getHomeLocation(critical),
    reason: 'DROP',
  };
  expect(mock).toHaveBeenCalledWith(completeDrop(expected));
  expect(mock).toHaveBeenCalledTimes(3);
  expect(store.getState().phase).toBe('IDLE');
});

it('should not trigger a drop on a publish if a drop is not pending', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    // will fire the pending drop action
    dropMiddleware,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(collectionStarting());

  mock.mockReset();
  store.dispatch(publish(publishAdditionArgs));

  expect(mock).toHaveBeenCalledWith(publish(publishAdditionArgs));
  expect(mock).toHaveBeenCalledTimes(1);
});
