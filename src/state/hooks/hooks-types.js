// @flow
import type {
  State,
  Hooks,
} from '../../types';

export type HookCaller = {|
  onStateChange: (hooks: Hooks, previous: State, current: State) => void,
|}
