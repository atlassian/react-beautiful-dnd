// @flow
import invariant from 'tiny-invariant';
import type { AutoScroller } from '../auto-scroller/auto-scroller-types';
import type { Action, Dispatch, MiddlewareStore } from '../store-types';
import type { State } from '../../types';

const shouldStop = (action: Action): boolean =>
  action.type === 'DROP_COMPLETE' ||
  action.type === 'DROP_ANIMATE' ||
  action.type === 'CLEAN';

const shouldCancelPending = (action: Action): boolean =>
  action.type === 'COLLECTION_STARTING';

export default (autoScroller: AutoScroller) => (store: MiddlewareStore) => (
  next: Dispatch,
) => (action: Action): any => {
  if (shouldStop(action)) {
    console.log('SHOULD STOP');
    autoScroller.stop();
    next(action);
    return;
  }

  if (shouldCancelPending(action)) {
    console.log('CANCEL PENDING');
    autoScroller.cancelPending();
    next(action);
    return;
  }

  if (action.type === 'INITIAL_PUBLISH') {
    // letting the action go first to hydrate the state
    next(action);
    const state: State = store.getState();
    invariant(
      state.phase === 'DRAGGING',
      'Expected phase to be DRAGGING after INITIAL_PUBLISH',
    );
    autoScroller.start(state);
    return;
  }

  // auto scroll happens in response to state changes
  // releasing all actions to the reducer first
  next(action);
  autoScroller.scroll(store.getState());
};
