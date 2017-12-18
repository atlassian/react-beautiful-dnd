// @flow
import type {
  State,
} from '../../types';

export type StyleMarshal = {|
  onPhaseChange: (previous: State, current: State) => void,
  styleContext: string,
  unmount: () => void,
|}
