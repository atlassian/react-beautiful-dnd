// @flow
/* eslint-disable no-console */
import type { Action, Store } from '../../state/store-types';

export default (store: Store) => (next: Action => mixed) => (
  action: Action,
): any => {
  console.group(`action: ${action.type}`);
  console.log('action payload', action.payload);
  console.log('state before', store.getState());

  const result: mixed = next(action);

  console.log('state after', store.getState());
  console.groupEnd();

  return result;
};
