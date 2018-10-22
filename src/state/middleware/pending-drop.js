// @flow
import { drop } from '../action-creators';
import type { State } from '../../types';
import type { MiddlewareStore, Dispatch, Action } from '../store-types';

export default (store: MiddlewareStore) => (next: Dispatch) => (
  action: Action,
): any => {
  // Always let the action go through first
  next(action);

  if (action.type !== 'PUBLISH') {
    return;
  }

  // A bulk replace occurred - check if
  // 1. there was a pending drop
  // 2. that the pending drop is no longer waiting

  const postActionState: State = store.getState();

  if (postActionState.phase === 'DROP_PENDING' && !postActionState.isWaiting) {
    store.dispatch(
      drop({
        reason: postActionState.reason,
      }),
    );
  }
};
