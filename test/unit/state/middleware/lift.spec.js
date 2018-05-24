// @flow
import { bindActionCreators } from 'redux';
import type { Store, PendingDrop } from '../../../../src/types';
import type { DimensionMarshal, Callbacks } from '../../../../src/state/dimension-marshal/dimension-marshal-types';
import middleware from '../../../../src/state/middleware/lift';
import createStore from './util/create-store';
import passThrough from './util/pass-through-middleware';
import {
  prepare,
  lift,
  initialPublish,
  bulkReplace,
  clean,
  animateDrop,
  completeDrop,
  bulkCollectionStarting,
  updateDroppableScroll,
  updateDroppableIsEnabled,
} from '../../../../src/state/action-creators';
import {
  liftArgs,
  initialPublishArgs,
  initialBulkReplaceArgs,
  getDragStart,
  getHomeLocation,
} from '../../../utils/preset-action-args';
import createDimensionMarshal from '../../../../src/state/dimension-marshal/dimension-marshal';
import { populateMarshal } from '../../view/dimension-marshal/util';

const getMarshal = (store: Store): DimensionMarshal => {
  const callbacks: Callbacks = bindActionCreators({
    bulkCollectionStarting,
    bulkReplace,
    updateDroppableScroll,
    updateDroppableIsEnabled,
  }, store.dispatch);
  const marshal: DimensionMarshal = createDimensionMarshal(callbacks);
  populateMarshal(marshal);

  return marshal;
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('should throw if a drag cannot be started when a lift action occurs', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    middleware(() => getMarshal(store)),
  );

  // first lift is all good
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(prepare());
  expect(store.getState().phase).toBe('PREPARING');

  // a lift is not permitted in the PREPARING phase
  expect(() => store.dispatch(lift(liftArgs))).toThrow();
});

it('should dispatch a prepare action to flush react-motion', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    middleware(() => getMarshal(store)),
  );

  // first lift is all good
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(prepare());
  expect(store.getState().phase).toBe('PREPARING');
});

it('should flush any animating drops', () => {
  const mock = jest.fn();
  const store: Store = createStore(
    passThrough(mock),
    middleware(() => getMarshal(store)),
  );

  // start a drag
  store.dispatch(prepare());
  store.dispatch(initialPublish(initialPublishArgs));
  store.dispatch(bulkReplace(initialBulkReplaceArgs));
  expect(store.getState().phase).toBe('DRAGGING');

  // start a drop
  const pending: PendingDrop = {
    newHomeOffset: { x: -1, y: -1 },
    impact: {
      movement: {
        displaced: [],
        amount: 0,
        isBeyondStartPosition: false,
      },
      direction: 'vertical',
      destination: getHomeLocation(),
    },
    result: {
      ...getDragStart(),
      destination: getHomeLocation(),
      reason: 'DROP',
    },
  };
  store.dispatch(animateDrop(pending));
  expect(store.getState().phase).toBe('DROP_ANIMATING');

  // while drop animating a lift occurs
  mock.mockReset();
  store.dispatch(lift(liftArgs));
  expect(mock).toHaveBeenCalledWith(lift(liftArgs));
  // the previous drag is flushed
  expect(mock).toHaveBeenCalledWith(completeDrop(pending.result));
  // the new lift continues
  expect(mock).toHaveBeenCalledWith(prepare());
  expect(mock).toHaveBeenCalledTimes(3);
});

describe('collection phase', () => {
  it('should not collect if the lift is aborted', () => {
    const mock = jest.fn();
    const store: Store = createStore(
      passThrough(mock),
      middleware(() => getMarshal(store)),
    );

    // first lift is preparing
    store.dispatch(lift(liftArgs));
    expect(mock).toHaveBeenCalledWith(lift(liftArgs));
    expect(mock).toHaveBeenCalledWith(prepare());
    expect(store.getState().phase).toBe('PREPARING');

    // lift is aborted
    store.dispatch(clean());

    // would normally start a lift
    mock.mockReset();
    jest.runOnlyPendingTimers();
    expect(mock).not.toHaveBeenCalled();
  });

  it('should publish the critical dimensions and then trigger a non-critical dimension collection', () => {
    const mock = jest.fn();
    const store: Store = createStore(
      passThrough(mock),
      middleware(() => getMarshal(store)),
    );

    // first lift is preparing
    store.dispatch(lift(liftArgs));
    expect(mock).toHaveBeenCalledWith(lift(liftArgs));
    expect(mock).toHaveBeenCalledWith(prepare());
    expect(store.getState().phase).toBe('PREPARING');

    // complete lift
    mock.mockReset();
    jest.runOnlyPendingTimers();
    expect(mock).toHaveBeenCalledWith(initialPublish(initialPublishArgs));
    expect(mock).toHaveBeenCalledWith(bulkCollectionStarting());
    expect(mock).toHaveBeenCalledTimes(2);
    expect(store.getState().phase).toBe('BULK_COLLECTING');

    // then there is a dimension marshal collection
    mock.mockReset();
    requestAnimationFrame.flush();
    expect(mock).toHaveBeenCalledWith(bulkReplace(initialBulkReplaceArgs));
    expect(mock).toHaveBeenCalledTimes(1);
    expect(store.getState().phase).toBe('DRAGGING');
  });
});
