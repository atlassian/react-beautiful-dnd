// @flow
import type { Store } from '../../../../src/state/store-types';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import middleware from '../../../../src/state/middleware/dimension-marshal-stopper';
import dropMiddleware from '../../../../src/state/middleware/drop/drop-middleware';
import createStore from './util/create-store';
import {
  clean,
  initialPublish,
  drop,
  completeDrop,
  animateDrop,
  collectionStarting,
} from '../../../../src/state/action-creators';
import {
  initialPublishArgs,
  getCompletedArgs,
  userCancelArgs,
} from '../../../utils/preset-action-args';

const getMarshal = (stopPublishing: Function): DimensionMarshal => {
  const fake: DimensionMarshal = ({
    stopPublishing,
  }: any);

  return fake;
};

it('should stop a collection if a drag is aborted', () => {
  const stopPublishing = jest.fn();
  const store: Store = createStore(
    middleware(() => getMarshal(stopPublishing)),
  );

  store.dispatch(initialPublish(initialPublishArgs));

  expect(stopPublishing).not.toHaveBeenCalled();
  store.dispatch(clean());
  expect(stopPublishing).toHaveBeenCalledTimes(1);
});

it('should not stop a collection if a drop is pending', () => {
  const stopPublishing = jest.fn();
  const store: Store = createStore(
    middleware(() => getMarshal(stopPublishing)),
    // will convert the drop into a drop pending
    dropMiddleware,
  );

  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  store.dispatch(collectionStarting());
  expect(store.getState().phase).toBe('COLLECTING');
  expect(stopPublishing).not.toHaveBeenCalled();

  // dropping
  store.dispatch(drop({ reason: 'DROP' }));
  expect(store.getState().phase).toBe('DROP_PENDING');
  expect(stopPublishing).not.toHaveBeenCalled();
});

it('should stop a collection if a drag is complete', () => {
  const stopPublishing = jest.fn();
  const store: Store = createStore(
    middleware(() => getMarshal(stopPublishing)),
    // will convert the drop into a drop pending
    dropMiddleware,
  );

  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  expect(stopPublishing).not.toHaveBeenCalled();

  // complete drop
  store.dispatch(completeDrop(getCompletedArgs('DROP')));

  expect(stopPublishing).toHaveBeenCalled();
});

it('should stop a collection if a drop animation starts', () => {
  const stopPublishing = jest.fn();
  const store: Store = createStore(
    middleware(() => getMarshal(stopPublishing)),
    // will convert the drop into a drop pending
    dropMiddleware,
  );

  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  expect(stopPublishing).not.toHaveBeenCalled();

  store.dispatch(animateDrop(userCancelArgs));

  expect(stopPublishing).toHaveBeenCalled();
});
