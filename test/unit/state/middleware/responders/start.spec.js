// @flow
import invariant from 'tiny-invariant';
import { initialPublish } from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/responders';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../util/preset-action-args';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import type { Responders } from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import getRespondersStub from './util/get-responders-stub';
import getAnnounce from './util/get-announce-stub';

jest.useFakeTimers();

it('should call the onDragStart responder when a initial publish occurs', () => {
  const responders: Responders = getRespondersStub();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  // prepare step should not trigger responder
  expect(responders.onDragStart).not.toHaveBeenCalled();

  // first initial publish
  store.dispatch(initialPublish(initialPublishArgs));
  expect(responders.onDragStart).not.toHaveBeenCalled();

  // flushing onDragStart
  jest.runOnlyPendingTimers();
  expect(responders.onDragStart).toHaveBeenCalledWith(
    getDragStart(),
    expect.any(Object),
  );
});

it('should call the onBeforeDragState and onDragStart in the correct order', () => {
  let mockCalled: ?number = null;
  let onBeforeDragStartCalled: ?number = null;
  let onDragStartCalled: ?number = null;
  const mock = jest.fn().mockImplementation(() => {
    mockCalled = performance.now();
  });
  const responders: Responders = getRespondersStub();
  // $FlowFixMe - no property mockImplementation
  responders.onBeforeDragStart.mockImplementation(() => {
    onBeforeDragStartCalled = performance.now();
  });
  // $FlowFixMe - no property mockImplementation
  responders.onDragStart.mockImplementation(() => {
    onDragStartCalled = performance.now();
  });
  const store: Store = createStore(
    middleware(() => responders, getAnnounce()),
    passThrough(mock),
  );

  // first initial publish
  store.dispatch(initialPublish(initialPublishArgs));
  expect(responders.onBeforeDragStart).toHaveBeenCalledWith(getDragStart());
  // flushing onDragStart
  jest.runOnlyPendingTimers();

  // checking the order
  invariant(onBeforeDragStartCalled);
  invariant(mockCalled);
  invariant(onDragStartCalled);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(onBeforeDragStartCalled).toBeLessThan(mockCalled);
  expect(mockCalled).toBeLessThan(onDragStartCalled);
});

it('should throw an exception if an initial publish is called before a drag ends', () => {
  const responders: Responders = getRespondersStub();
  const store: Store = createStore(middleware(() => responders, getAnnounce()));

  const start = () => {
    store.dispatch(initialPublish(initialPublishArgs));
    jest.runOnlyPendingTimers();
  };
  // first execution is all good
  start();
  expect(responders.onDragStart).toHaveBeenCalled();

  // should not happen
  expect(start).toThrow();
});
