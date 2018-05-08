// @flow
import type { Store, State, Action } from '../../types';
import type { StyleMarshal } from '../../view/style-marshal/style-marshal-types';

export default (marshal: StyleMarshal) =>
  (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
    const state: State = store.getState();

    if (state.phase === ('DRAGGING' || 'BULK_COLLECTING')) {
      marshal.dragging();
      return next(action);
    }

    if (state.phase === 'DROP_ANIMATING') {
      marshal.dropping(state.pending.result.reason);
      return next(action);
    }

    marshal.resting();

    return next(action);
  };

