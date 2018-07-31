// @flow
import type { Action, Middleware } from '../../../../../src/state/store-types';

const passThrough = (mock: Function): Middleware => {
  const result: Middleware = () => (next: Function) => (
    action: Action,
  ): any => {
    mock(action);
    next(action);
  };

  return result;
};

export default passThrough;
