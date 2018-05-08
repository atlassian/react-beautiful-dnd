// @flow
import createHookCaller from '../hooks/hook-caller';
import type { Store, State, Action, Hooks } from '../../types';
import type { StyleMarshal } from '../../view/style-marshal/style-marshal-types';

export default (getHooks: () => Hooks, announce: Announce) => {
  const hookCaller: HookCaller = createHookCaller(announce);
  return (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
    const state: State = store.getState();

    // TODO:
    // hookCaller.onStateChange(getHooks(), )
    return next(action);
  };
};

