// @flow
import type { Action, Dispatch } from '../store-types';
import type { FocusMarshal } from '../focus-marshal';

export default (marshal: FocusMarshal) => {
  let isWatching: boolean = false;

  return () => (next: Dispatch) => (action: Action): any => {
    if (action.type === 'INITIAL_PUBLISH') {
      isWatching = true;

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
      marshal.tryRestoreFocusRecorded();
    }
  };
};
