// @flow
import type {
  State,
} from '../../types';

export type StyleMarshal = {|
  // TODO: swap order to be compat with english?
  onStateChange: (current: State, previous: State) => void,
  draggableClassName: string,
  styleTagDataAttribute: string,
|}
