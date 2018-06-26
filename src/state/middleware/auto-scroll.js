// @flow
import type { AutoScroller } from '../auto-scroller/auto-scroller-types';
import type { Store, State, Action } from '../../types';

export default (getScroller: () => AutoScroller) => (store: Store) => (
  next: Action => mixed,
) => {
  const shouldCancel = (action: Action) =>
    // Need to cancel any pending auto scrolling when drag is ending
    action.type === 'CANCEL' ||
    action.type === 'DROP_ANIMATE' ||
    action.type === 'DROP' ||
    action.type === 'DROP_COMPLETE' ||
    // A new collection is starting - cancel any pending auto scrolls
    action.type === 'COLLECTION_STARTING';

  return (action: Action): mixed => {
    if (shouldCancel(action)) {
      getScroller().cancel();
      next(action);
      return;
    }

    // auto scroll happens in response to state changes
    // releasing all actions to the reducer first
    next(action);

    const state: State = store.getState();

    // Only allowing auto scrolling in the DRAGGING phase
    if (state.phase !== 'DRAGGING') {
      return;
    }

    if (state.autoScrollMode === 'FLUID') {
      getScroller().fluidScroll(state);
      return;
    }

    if (!state.scrollJumpRequest) {
      return;
    }

    getScroller().jumpScroll(state);
  };
};
