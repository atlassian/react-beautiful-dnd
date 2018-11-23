// @flow
import type { AutoScroller } from '../auto-scroller/auto-scroller-types';
import type { Action, Dispatch, MiddlewareStore } from '../store-types';

const shouldStart = (action: Action): boolean => action.type === 'LIFT';

const shouldEnd = (action: Action): boolean =>
  action.type === 'DROP' || action.type === 'CLEAN';

const shouldCancel = (action: Action): boolean =>
  shouldEnd(action) || action.type === 'COLLECTION_STARTING';

export default (getScroller: () => AutoScroller) => (
  store: MiddlewareStore,
) => (next: Dispatch) => (action: Action): any => {
  if (shouldCancel(action)) {
    getScroller().cancelPending();
    next(action);
    return;
  }

  if (shouldStart(action)) {
    getScroller().start();
    next(action);
    return;
  }

  if (shouldEnd(action)) {
    getScroller().stop();
    next(action);
    return;
  }

  // auto scroll happens in response to state changes
  // releasing all actions to the reducer first
  next(action);
  getScroller().scroll(store.getState());
};
