// @flow
import type { Action } from '../../../types';

export default (action: Action): boolean =>
  action.type === 'CLEAN' ||
  action.type === 'DROP_ANIMATE' ||
  action.type === 'DROP_COMPLETE' ||
  action.type === 'DROP_PENDING';
