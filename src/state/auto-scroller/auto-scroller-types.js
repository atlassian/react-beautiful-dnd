// @flow
import type { State } from '../../types';

export type AutoScroller = {|
  onStateChange: (previous: State, current: State) => void,
|}
