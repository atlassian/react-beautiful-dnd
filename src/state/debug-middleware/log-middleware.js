// @flow
/* eslint-disable no-console */
import type { Store, Action, State } from '../../types';

export default (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
  console.group(`action: ${action.type}`);
  const before: State = store.getState();

  const result: mixed = next(action);

  const after: State = store.getState();

  console.log('state', { before, after });
  console.groupEnd();

  return result;
};
