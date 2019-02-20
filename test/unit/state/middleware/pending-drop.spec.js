// @flow
import invariant from 'tiny-invariant';
import type { State, DropResult } from '../../../../src/types';
import type { Store } from '../../../../src/state/store-types';
import middleware from '../../../../src/state/middleware/pending-drop';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import dropMiddleware from '../../../../src/state/middleware/drop/drop-middleware';
import getHomeLocation from '../../../../src/state/get-home-location';
import {
  initialPublish,
  drop,
  completeDrop,
  publishWhileDragging,
  collectionStarting,
} from '../../../../src/state/action-creators';
import {
  getDragStart,
  critical,
  publishAdditionArgs,
  initialPublishWithScrollables,
  completed,
  type DropCompletedArgs,
} from '../../../utils/preset-action-args';

it('should trigger a drop on a dynamic publish if a drop pending is waiting', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    // will fire the pending drop action
    dropMiddleware,
    middleware,
  );

  store.dispatch(initialPublish(initialPublishWithScrollables));
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
  store.dispatch(publishWhileDragging(publishAdditionArgs));

  TODO;
  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));
  const result: DropResult = {
    ...getDragStart(),
    destination: getHomeLocation(critical.draggable),
    reason: 'DROP',
    combine: null,
  };
  // const completed: CompletedDrag = {
  //   critical,
  //   result,
  //   impact,
  // };
  // const expected: DropCompletedArgs = {
  //   completed,
  //   shouldFlush: false,
  // };
  expect(mock).toHaveBeenCalledWith(
    completeDrop({ completed, shouldFlush: false }),
  );
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

  store.dispatch(initialPublish(initialPublishWithScrollables));
  store.dispatch(collectionStarting());

  mock.mockReset();
  store.dispatch(publishWhileDragging(publishAdditionArgs));

  expect(mock).toHaveBeenCalledWith(publishWhileDragging(publishAdditionArgs));
  expect(mock).toHaveBeenCalledTimes(1);
});
