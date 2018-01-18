// @flow
import type { State } from '../../types';

export type AutoScrollMarshal = {|
  onStateChange: (previous: State, current: State) => void,
|}
