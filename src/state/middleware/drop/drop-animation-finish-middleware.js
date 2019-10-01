// @flow
import { invariant } from '../../../invariant';
import { completeDrop } from '../../action-creators';
import type { State } from '../../../types';
import type { MiddlewareStore, Action, Dispatch } from '../../store-types';

export default (store: MiddlewareStore) => (next: Dispatch) => (
  action: Action,
): any => {
  if (action.type !== 'DROP_ANIMATION_FINISHED') {
    next(action);
    return;
  }

  const state: State = store.getState();
  invariant(
    state.phase === 'DROP_ANIMATING',
    'Cannot finish a drop animating when no drop is occurring',
  );
  store.dispatch(completeDrop({ completed: state.completed }));
};
