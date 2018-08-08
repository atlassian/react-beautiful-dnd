// @flow
import type { Action, Dispatch } from '../store-types';
import type { StyleMarshal } from '../../view/style-marshal/style-marshal-types';

export default (marshal: StyleMarshal) => () => (next: Dispatch) => (
  action: Action,
): any => {
  if (action.type === 'ON_DRAG_START_FINISHED' || action.type === 'PUBLISH') {
    marshal.dragging();
  }

  if (action.type === 'COLLECTION_STARTING') {
    marshal.collecting();
  }

  if (action.type === 'DROP_ANIMATE') {
    marshal.dropping(action.payload.result.reason);
  }

  // this will clear any styles immediately before a reorder
  if (action.type === 'CLEAN' || action.type === 'DROP_COMPLETE') {
    marshal.resting();
  }

  next(action);
};
