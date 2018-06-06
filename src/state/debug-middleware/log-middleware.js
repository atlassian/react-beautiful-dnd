// @flow
/* eslint-disable no-console */
import type { Store, Action } from '../../types';

export default (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
  console.group(`action: ${action.type}`);
  console.log('state before', store.getState());

  const result: mixed = next(action);

  console.log('state after', store.getState());
  console.groupEnd();

  return result;
};
