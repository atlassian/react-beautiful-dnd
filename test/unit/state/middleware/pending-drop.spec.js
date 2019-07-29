// @flow
import invariant from 'tiny-invariant';
import type { State } from '../../../../src/types';
import type { Store } from '../../../../src/state/store-types';
import {
  collectionStarting,
  completeDrop,
  drop,
  initialPublish,
  publishWhileDragging,
} from '../../../../src/state/action-creators';
import dropMiddleware from '../../../../src/state/middleware/drop/drop-middleware';
import middleware from '../../../../src/state/middleware/pending-drop';
import {
  initialPublishWithScrollables,
  publishAdditionArgs,
} from '../../../utils/preset-action-args';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';

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

  expect(mock).toHaveBeenCalledWith(drop({ reason: 'DROP' }));

  expect(mock).toHaveBeenCalledWith(
    // $ExpectError - this calculation is not completed by this module and it is non trival
    completeDrop({
      completed: expect.any(Object),
      shouldFlush: false,
    }),
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
