// @flow
import invariant from 'tiny-invariant';
import { initialPublish } from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/handles';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import type { Handles } from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import getHandlesStub from './util/get-handles-stub';
import getAnnounce from './util/get-announce-stub';

jest.useFakeTimers();

it('should call the onDragStart handle when a initial publish occurs', () => {
  const handles: Handles = getHandlesStub();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  // prepare step should not trigger handle
  expect(handles.onDragStart).not.toHaveBeenCalled();

  // first initial publish
  store.dispatch(initialPublish(initialPublishArgs));
  expect(handles.onDragStart).not.toHaveBeenCalled();

  // flushing onDragStart
  jest.runOnlyPendingTimers();
  expect(handles.onDragStart).toHaveBeenCalledWith(
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
  const handles: Handles = getHandlesStub();
  // $FlowFixMe - no property mockImplementation
  handles.onBeforeDragStart.mockImplementation(() => {
    onBeforeDragStartCalled = performance.now();
  });
  // $FlowFixMe - no property mockImplementation
  handles.onDragStart.mockImplementation(() => {
    onDragStartCalled = performance.now();
  });
  const store: Store = createStore(
    middleware(() => handles, getAnnounce()),
    passThrough(mock),
  );

  // first initial publish
  store.dispatch(initialPublish(initialPublishArgs));
  expect(handles.onBeforeDragStart).toHaveBeenCalledWith(getDragStart());
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
  const handles: Handles = getHandlesStub();
  const store: Store = createStore(middleware(() => handles, getAnnounce()));

  const start = () => {
    store.dispatch(initialPublish(initialPublishArgs));
    jest.runOnlyPendingTimers();
  };
  // first execution is all good
  start();
  expect(handles.onDragStart).toHaveBeenCalled();

  // should not happen
  expect(start).toThrow();
});
