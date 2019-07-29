// @flow
/* eslint-disable no-console */
import type { Action, Store } from '../../state/store-types';

type Mode = 'verbose' | 'light';

export default (mode?: Mode = 'verbose') => (store: Store) => (
  next: Action => mixed,
) => (action: Action): any => {
  if (mode === 'light') {
    console.log('🏃‍ Action:', action.type);
    return next(action);
  }

  console.group(`action: ${action.type}`);
  console.log('action payload', action.payload);

  console.log('state before', store.getState());

  const result: mixed = next(action);

  console.log('state after', store.getState());
  console.groupEnd();

  return result;
};
