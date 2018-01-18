// @flow
/* eslint-disable no-console */
import type { Store, Action, State } from '../types';
import * as logger from '../log';

export default (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
  logger.group(`action: ${action.type}`);
  const before: State = store.getState();

  const result: mixed = next(action);

  const after: State = store.getState();

  logger.log({ action, before, after });
  logger.groupEnd();

  return result;
};
