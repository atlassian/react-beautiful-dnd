// @flow
import invariant from 'tiny-invariant';
import { initialPublish } from '../../../../../src/state/action-creators';
import middleware from '../../../../../src/state/middleware/hooks';
import {
  getDragStart,
  initialPublishArgs,
} from '../../../../utils/preset-action-args';
import createStore from '../util/create-store';
import passThrough from '../util/pass-through-middleware';
import type { Hooks } from '../../../../../src/types';
import type { Store } from '../../../../../src/state/store-types';
import getHooksStub from './util/get-hooks-stub';
import getAnnounce from './util/get-announce-stub';

it('should call the onDragStart hook when a initial publish occurs', () => {
  const hooks: Hooks = getHooksStub();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  // prepare step should not trigger hook
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  // first initial publish
  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onDragStart).not.toHaveBeenCalled();

  // flushing animation frame for onDragStart
  requestAnimationFrame.step();
  expect(hooks.onDragStart).toHaveBeenCalledWith(
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
  const hooks: Hooks = getHooksStub();
  // $FlowFixMe - no property mockImplementation
  hooks.onBeforeDragStart.mockImplementation(() => {
    onBeforeDragStartCalled = performance.now();
  });
  // $FlowFixMe - no property mockImplementation
  hooks.onDragStart.mockImplementation(() => {
    onDragStartCalled = performance.now();
  });
  const store: Store = createStore(
    middleware(() => hooks, getAnnounce()),
    passThrough(mock),
  );

  // first initial publish
  store.dispatch(initialPublish(initialPublishArgs));
  expect(hooks.onBeforeDragStart).toHaveBeenCalledWith(getDragStart());
  // flushing onDragStart
  requestAnimationFrame.step();

  // checking the order
  invariant(onBeforeDragStartCalled);
  invariant(mockCalled);
  invariant(onDragStartCalled);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(onBeforeDragStartCalled).toBeLessThan(mockCalled);
  expect(mockCalled).toBeLessThan(onDragStartCalled);
});

it('should throw an exception if an initial publish is called before a drag ends', () => {
  const hooks: Hooks = getHooksStub();
  const store: Store = createStore(middleware(() => hooks, getAnnounce()));

  const start = () => {
    store.dispatch(initialPublish(initialPublishArgs));
    requestAnimationFrame.step();
  };
  // first execution is all good
  start();
  expect(hooks.onDragStart).toHaveBeenCalled();

  // should not happen
  expect(start).toThrow();
});
