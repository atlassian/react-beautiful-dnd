// @flow
/* eslint-disable no-console */
import * as timings from '../../debug/timings';
import type { Action } from '../../types';

export default () => (next: (Action) => mixed) => (action: Action): mixed => {
  const key = `redux action: ${action.type}`;
  timings.start(key);

  const result: mixed = next(action);

  timings.finish(key);

  return result;
};
