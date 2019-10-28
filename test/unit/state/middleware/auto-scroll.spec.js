// @flow
import type { Action, Store } from '../../../../src/state/store-types';
import type { AutoScroller } from '../../../../src/state/auto-scroller/auto-scroller-types';
import createStore from './util/create-store';
import middleware from '../../../../src/state/middleware/auto-scroll';
import {
  animateDropArgs,
  userCancelArgs,
  initialPublishArgs,
  getCompletedArgs,
} from '../../../util/preset-action-args';
import {
  animateDrop,
  completeDrop,
  initialPublish,
  moveDown,
  flush,
} from '../../../../src/state/action-creators';

const shouldStop: Action[] = [
  animateDrop(animateDropArgs),
  animateDrop(userCancelArgs),
  completeDrop(getCompletedArgs('CANCEL')),
  completeDrop(getCompletedArgs('DROP')),
  flush(),
];

const getScrollerStub = (): AutoScroller => ({
  start: jest.fn(),
  stop: jest.fn(),
  scroll: jest.fn(),
});

shouldStop.forEach((action: Action) => {
  it(`should stop the auto scroller when a ${action.type} is fired`, () => {
    const scroller: AutoScroller = getScrollerStub();
    const store: Store = createStore(middleware(scroller));

    store.dispatch(initialPublish(initialPublishArgs));
    expect(store.getState().phase).toBe('DRAGGING');
    expect(scroller.start).toHaveBeenCalled();

    store.dispatch(action);
    expect(scroller.stop).toHaveBeenCalled();
  });
});

it('should fire a scroll when there is an update', () => {
  const scroller: AutoScroller = getScrollerStub();
  const store: Store = createStore(middleware(scroller));

  store.dispatch(initialPublish(initialPublishArgs));
  expect(scroller.start).toHaveBeenCalledWith(store.getState());

  expect(scroller.scroll).not.toHaveBeenCalled();
  store.dispatch(moveDown());
  expect(scroller.scroll).toHaveBeenCalledWith(store.getState());
});
