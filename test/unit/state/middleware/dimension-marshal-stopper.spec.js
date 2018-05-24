// @flow
import type { Store, DropResult, PendingDrop } from '../../../../src/types';
import type { DimensionMarshal } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import middleware from '../../../../src/state/middleware/dimension-marshal-stopper';
import dropMiddleware from '../../../../src/state/middleware/drop';
import createStore from './util/create-store';
import { clean, prepare, initialPublish, drop, bulkReplace, completeDrop, animateDrop } from '../../../../src/state/action-creators';
import { initialPublishArgs, initialBulkReplaceArgs, getDragStart } from '../../../utils/preset-action-args';
import noImpact from '../../../../src/state/no-impact';

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

it('should not stop a collection if a drop is pending', () => {
  const stopPublishing = jest.fn();
  const store: Store = createStore(
    middleware(() => getMarshal(stopPublishing)),
    // will convert the drop into a drop pending
    dropMiddleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  expect(store.getState().phase).toBe('BULK_COLLECTING');
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

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(bulkReplace(initialBulkReplaceArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  expect(stopPublishing).not.toHaveBeenCalled();

  // complete drop
  const result: DropResult = {
    ...getDragStart(),
    destination: null,
    reason: 'CANCEL',
  };
  store.dispatch(completeDrop(result));

  expect(stopPublishing).toHaveBeenCalled();
});

it('should stop a collection if a drop animation starts', () => {
  const stopPublishing = jest.fn();
  const store: Store = createStore(
    middleware(() => getMarshal(stopPublishing)),
    // will convert the drop into a drop pending
    dropMiddleware,
  );

  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(bulkReplace(initialBulkReplaceArgs));
  expect(store.getState().phase).toBe('DRAGGING');
  expect(stopPublishing).not.toHaveBeenCalled();

  const pending: PendingDrop = {
    newHomeOffset: { x: 0, y: 0 },
    impact: noImpact,
    result: {
      ...getDragStart(),
      // destination cleared
      destination: null,
      reason: 'CANCEL',
    },
  };
  store.dispatch(animateDrop(pending));

  expect(stopPublishing).toHaveBeenCalled();
});
