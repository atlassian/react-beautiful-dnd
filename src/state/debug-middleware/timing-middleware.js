// @flow
/* eslint-disable no-console */
import type { Action } from '../../types';

export default () => (next: (Action) => mixed) => (action: Action): mixed => {
  const key = `action: ${action.type}`;
  console.time(key);

  const result: mixed = next(action);

  console.timeEnd(key);

  return result;
};
