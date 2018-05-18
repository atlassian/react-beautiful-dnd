// @flow
import type { Store } from '../../../../src/types';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import middleware from '../../../../src/state/middleware/dimension-marshal-stopper';
import createStore from './util/create-store';
import { clean, prepare, initialPublish, drop } from '../../../../src/state/action-creators';
import { initialPublishArgs } from './util/preset-action-args';

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

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  expect(stopPublishing).not.toHaveBeenCalled();
  store.dispatch(clean());
  expect(stopPublishing).toHaveBeenCalledTimes(1);
});

it('should stop a collection if a drag is dropped', () => {
  const stopPublishing = jest.fn();
  const store: Store = createStore(
    middleware(() => getMarshal(stopPublishing)),
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));

  expect(stopPublishing).not.toHaveBeenCalled();
  store.dispatch(drop({ reason: 'DROP' }));
  expect(stopPublishing).toHaveBeenCalledTimes(1);
});
