// @flow
import type { Action, Store } from '../../../../src/state/store-types';
import type { AutoScroller } from '../../../../src/state/auto-scroller/auto-scroller-types';
import createStore from './util/create-store';
import middleware from '../../../../src/state/middleware/auto-scroll';
import {
  animateDropArgs,
  userCancelArgs,
  completeDropArgs,
  initialPublishArgs,
} from '../../../utils/preset-action-args';
import {
  animateDrop,
  drop,
  completeDrop,
  collectionStarting,
  initialPublish,
  moveDown,
  type InitialPublishArgs,
  clean,
} from '../../../../src/state/action-creators';

const shouldCancelPending: Action[] = [collectionStarting()];

const shouldStop: Action[] = [
  animateDrop(animateDropArgs),
  animateDrop(userCancelArgs),
  completeDrop(completeDropArgs),
  clean(),
];

const getScrollerStub = (): AutoScroller => ({
  start: jest.fn(),
  cancelPending: jest.fn(),
  stop: jest.fn(),
  scroll: jest.fn(),
});

shouldCancelPending.forEach((action: Action) => {
  it(`should cancel a pending scroll when a ${action.type} is fired`, () => {
    const scroller: AutoScroller = getScrollerStub();
    const store: Store = createStore(middleware(() => scroller));

    store.dispatch(initialPublish(initialPublishArgs));
    expect(store.getState().phase).toBe('DRAGGING');
    expect(scroller.start).toHaveBeenCalled();

    expect(scroller.cancelPending).not.toHaveBeenCalled();
    store.dispatch(action);
    expect(scroller.cancelPending).toHaveBeenCalled();
  });
});

shouldStop.forEach((action: Action) => {
  it(`should stop the auto scroller when a ${action.type} is fired`, () => {
    const scroller: AutoScroller = getScrollerStub();
    const store: Store = createStore(middleware(() => scroller));

    store.dispatch(initialPublish(initialPublishArgs));
    expect(store.getState().phase).toBe('DRAGGING');
    expect(scroller.start).toHaveBeenCalled();

    store.dispatch(action);
    expect(scroller.stop).toHaveBeenCalled();
  });
});

it('should fire a scroll when there is an update', () => {
  const scroller: AutoScroller = getScrollerStub();
  const store: Store = createStore(middleware(() => scroller));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(scroller.start).toHaveBeenCalledWith(store.getState());

  expect(scroller.scroll).not.toHaveBeenCalled();
  store.dispatch(moveDown());
  expect(scroller.scroll).toHaveBeenCalledWith(store.getState());
});
