// @flow
import type { Action, Dispatch } from '../store-types';
import type { FocusMarshal } from '../focus-marshal';

export default (marshal: FocusMarshal) => {
  let isWatching: boolean = false;
  let focusTimeoutId: ?TimeoutID = null;

  function focusOnTimeout() {
    if (focusTimeoutId) {
      return;
    }
    focusTimeoutId = setTimeout(() => marshal.tryRestoreFocusRecorded());
  }

  function abortFocusTimeout() {
    if (!focusTimeoutId) {
      return;
    }
    clearTimeout(focusTimeoutId);
    focusTimeoutId = null;
  }

  return () => (next: Dispatch) => (action: Action): any => {
    if (action.type === 'INITIAL_PUBLISH') {
      isWatching = true;
      abortFocusTimeout();

      marshal.tryRecordFocus(action.payload.critical.draggable.id);
      next(action);
      marshal.tryRestoreFocusRecorded();
      return;
    }

    next(action);

    if (!isWatching) {
      return;
    }

    // on end - focus after timeout
    if (action.type === 'DROP_COMPLETE' || action.type === 'CLEAN') {
      isWatching = false;
      focusOnTimeout();
    }
  };
};
