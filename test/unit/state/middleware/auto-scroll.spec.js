
// @flow
import type { Action, Store } from '../../../../src/types';
import type { AutoScroller } from '../../../../src/state/auto-scroller/auto-scroller-types';
import createStore from './util/create-store';
import middleware from '../../../../src/state/middleware/auto-scroll';
import { animateDropArgs, userCancelArgs, completeDropArgs, initialPublishArgs } from '../../../utils/preset-action-args';
import { animateDrop, drop, completeDrop, collectionStarting, prepare, initialPublish, moveDown, type InitialPublishArgs } from '../../../../src/state/action-creators';

const shouldCancel: Action[] = [
  animateDrop(animateDropArgs),
  animateDrop(userCancelArgs),
  drop({ reason: 'DROP' }),
  drop({ reason: 'CANCEL' }),
  completeDrop(completeDropArgs),
  collectionStarting(),
];

const getScrollerStub = (): AutoScroller => ({
  cancel: jest.fn(),
  fluidScroll: jest.fn(),
  jumpScroll: jest.fn(),
});

shouldCancel.forEach((action: Action) => {
  it(`should cancel a pending scroll when a ${action.type} is fired`, () => {
    const scroller: AutoScroller = getScrollerStub();
    const store: Store = createStore(middleware(() => scroller));

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(store.getState().phase).toBe('DRAGGING');

    expect(scroller.cancel).not.toHaveBeenCalled();
    store.dispatch(action);
    expect(scroller.cancel).toHaveBeenCalled();
  });
});

it('should fire a fluid scroll when in the FLUID auto scrolling mode', () => {
  const scroller: AutoScroller = getScrollerStub();
  const store: Store = createStore(middleware(() => scroller));

  store.dispatch(prepare());
  expect(scroller.fluidScroll).not.toHaveBeenCalled();

  store.dispatch(initialPublish(initialPublishArgs));
  expect(scroller.fluidScroll).toHaveBeenCalledWith(store.getState());

  store.dispatch(moveDown());
  expect(scroller.fluidScroll).toHaveBeenCalledWith(store.getState());
  expect(scroller.jumpScroll).not.toHaveBeenCalled();
});

it('should fire a jump scroll when in the JUMP auto scrolling mode and there is a scroll jump request', () => {
  const customInitial: InitialPublishArgs = {
    ...initialPublishArgs,
    autoScrollMode: 'JUMP',
  };
  const scroller: AutoScroller = getScrollerStub();
  const store: Store = createStore(middleware(() => scroller));
  store.dispatch(prepare());

  store.dispatch(initialPublish(customInitial));
  expect(scroller.jumpScroll).not.toHaveBeenCalled();
  expect(scroller.fluidScroll).not.toHaveBeenCalled();

  store.dispatch(moveDown());
  expect(scroller.jumpScroll).not.toHaveBeenCalled();

  // Currently no way to poke the state through an action to create a scrollJumpRequest
  // TODO: investigate mechanism
});

