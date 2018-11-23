// @flow
import invariant from 'tiny-invariant';
import type { AutoScroller } from '../auto-scroller/auto-scroller-types';
import type { Action, Dispatch, MiddlewareStore } from '../store-types';
import type { State } from '../../types';

const shouldEnd = (action: Action): boolean =>
  action.type === 'DROP_COMPLETE' ||
  action.type === 'DROP_ANIMATE' ||
  action.type === 'CLEAN';

const shouldCancel = (action: Action): boolean =>
  shouldEnd(action) || action.type === 'COLLECTION_STARTING';

export default (getScroller: () => AutoScroller) => (
  store: MiddlewareStore,
) => (next: Dispatch) => (action: Action): any => {
  if (shouldEnd(action)) {
    getScroller().stop();
    next(action);
    return;
  }

  if (shouldCancel(action)) {
    getScroller().cancelPending();
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
    getScroller().start(state);
    return;
  }

  // auto scroll happens in response to state changes
  // releasing all actions to the reducer first
  next(action);
  getScroller().scroll(store.getState());
};
