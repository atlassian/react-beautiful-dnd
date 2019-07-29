// @flow
import type { DropResult } from '../../types';
import type { Action, Dispatch } from '../store-types';
import type { FocusMarshal } from '../../view/use-focus-marshal/focus-marshal-types';

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

    if (action.type === 'CLEAN') {
      isWatching = false;
      marshal.tryRestoreFocusRecorded();
      return;
    }

    if (action.type === 'DROP_COMPLETE') {
      isWatching = false;
      const result: DropResult = action.payload.completed.result;

      // give focus to the combine target when combining
      if (result.combine) {
        marshal.tryShiftRecord(result.draggableId, result.combine.draggableId);
      }
      marshal.tryRestoreFocusRecorded();
    }
  };
};
