// @flow
import { drop } from '../action-creators';
import type { State } from '../../types';
import type { Store, Action } from '../store-types';

export default (store: Store) => (next: Action => mixed) => (
  action: Action,
): mixed => {
  // Always let the action go through first
  next(action);

  if (action.type !== 'PUBLISH') {
    return;
  }

  // A bulk replace occurred - check if
  // 1. there was a pending drop
  // 2. that the pending drop is no longer waiting

  const postActionState: State = store.getState();

  if (postActionState.phase !== 'DROP_PENDING') {
    return;
  }

  if (!postActionState.isWaiting) {
    store.dispatch(
      drop({
        reason: postActionState.reason,
      }),
    );
  }
};
