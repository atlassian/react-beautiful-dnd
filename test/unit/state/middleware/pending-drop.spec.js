// @flow
import invariant from 'tiny-invariant';
import type { Store, State, DropResult } from '../../../../src/types';
import middleware from '../../../../src/state/middleware/pending-drop';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import dropMiddleware from '../../../../src/state/middleware/drop';
import { prepare, initialPublish, drop, bulkReplace, completeDrop, clean } from '../../../../src/state/action-creators';
import { initialBulkReplaceArgs, initialPublishArgs, getDragStart, getHomeLocation } from '../../../utils/preset-action-args';

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
  store.dispatch(drop({ reason: 'DROP' }));

  const postDrop: State = store.getState();
  invariant(postDrop.phase === 'DROP_PENDING', `Incorrect phase : ${postDrop.phase}`);
  expect(postDrop.isWaiting).toBe(true);

  // This will finish the drag
  mock.mockReset();
  store.dispatch(bulkReplace(initialBulkReplaceArgs));

  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
  const result: DropResult = {
    ...getDragStart(),
    destination: getHomeLocation(),
    reason: 'DROP',
  };
  expect(mock).toHaveBeenCalledWith(completeDrop(result));
  expect(mock).toHaveBeenCalledWith(clean());
  expect(mock).toHaveBeenCalledTimes(4);
  expect(store.getState().phase).toBe('IDLE');
});

it('should not trigger a drop on a bulk replace if a drop is not pending', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    // will fire the pending drop action
    dropMiddleware,
    middleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  mock.mockReset();
  store.dispatch(bulkReplace(initialBulkReplaceArgs));

  expect(mock).toHaveBeenCalledWith(bulkReplace(initialBulkReplaceArgs));
  expect(mock).toHaveBeenCalledTimes(1);
});
