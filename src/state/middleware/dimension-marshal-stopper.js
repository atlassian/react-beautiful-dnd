// @flow
import type { Action, Dispatch } from '../store-types';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';

export default (marshal: DimensionMarshal) => () => (next: Dispatch) => (
  action: Action,
): any => {
  // Not stopping a collection on a 'DROP' as we want a collection to continue
  if (
    // drag is finished
    action.type === 'DROP_COMPLETE' ||
    action.type === 'FLUSH' ||
    // no longer accepting changes once the drop has started
    action.type === 'DROP_ANIMATE'
  ) {
    marshal.stopPublishing();
  }

  next(action);
};
