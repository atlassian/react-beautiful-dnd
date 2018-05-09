
// @flow
import { drop } from '../action-creators';
import type {
  Store,
  State,
  Action,
} from '../../types';

export default (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
  next(action);

  if (action.type !== 'BULK_REPLACE') {
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
    console.log('ending a pending drop');
    store.dispatch(drop({
      reason: postActionState.reason,
    }));
  }
};
