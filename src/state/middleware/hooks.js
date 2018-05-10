// @flow
import createHookCaller from '../hooks/hook-caller';
import type { Store, State, Action, Hooks } from '../../types';
import type { StyleMarshal } from '../../view/style-marshal/style-marshal-types';

export default (getHooks: () => Hooks, announce: Announce) => {
  (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
    // on drag start
    if (action.type === 'INITIAL_PUBLISH') {

    }

    // On drag end?
    if (action.type === 'CLEAN') {

    }












    // TODO: Perform hooks after releasing action?
    next(action);




  };

