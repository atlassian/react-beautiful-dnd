// @flow
import type { Action } from '../../../types';

export default (action: Action): boolean =>
  action.type === 'CLEAN' || action.type === 'DROP';
