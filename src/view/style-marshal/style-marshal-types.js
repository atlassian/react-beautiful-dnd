// @flow
import type {
  State,
} from '../../types';

export type StyleMarshal = {|
  onPhaseChange: (current: State) => void,
  styleContext: string,
  unmount: () => void,
|}
