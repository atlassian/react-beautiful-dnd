// @flow
import type {
  DragStart,
  DropResult,
  Announce,
  State,
} from '../../types';

export type Hooks = {|
  onDragStart?: (start: DragStart, announce: Announce) => void,
  onDragUpdate?: (current: DropResult, announce: Announce) => void,
  onDragEnd: (result: DropResult, announce: Announce) => void,
|}

export type HookCaller = {|
  onStateChange: (hooks: Hooks, previous: State, current: State) => void,
|}
