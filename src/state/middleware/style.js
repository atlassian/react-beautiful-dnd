// @flow
import type { Action } from '../../types';
import type { StyleMarshal } from '../../view/style-marshal/style-marshal-types';

export default (marshal: StyleMarshal) =>
  () => (next: (Action) => mixed) => (action: Action): mixed => {
    if (action.type === 'BULK_COLLECTION_STARTING') {
      marshal.collecting();
    }

    if (action.type === 'INITIAL_PUBLISH' || action.type === 'BULK_REPLACE') {
      marshal.dragging();
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

