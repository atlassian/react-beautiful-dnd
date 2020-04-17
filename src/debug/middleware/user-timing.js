// @flow
import type { Action } from '../../state/store-types';

export default () => (next: (Action) => mixed) => (action: Action): any => {
  const title: string = `👾 redux (action): ${action.type}`;
  const startMark: string = `${action.type}:start`;
  const endMark: string = `${action.type}:end`;

  performance.mark(startMark);
  const result: mixed = next(action);
  performance.mark(endMark);

  performance.measure(title, startMark, endMark);

  return result;
};
