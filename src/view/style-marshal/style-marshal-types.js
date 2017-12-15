// @flow
import type {
  State,
} from '../../types';

export type Marshal = {|
  // TODO: swap order to be compat with english?
  onStateChange: (current: State, previous: State) => void,
  draggableClassName: string,
  tagName: string,
|}
