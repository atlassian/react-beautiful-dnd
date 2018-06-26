// @flow
import type { Action } from '../../../../../src/state/store-types';

const passThrough = (mock: Function) => () => (next: Function) => (
  action: Action,
) => {
  mock(action);
  next(action);
};

export default passThrough;
