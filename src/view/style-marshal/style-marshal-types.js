// @flow
import type {
  DropReason,
} from '../../types';

export type StyleMarshal = {|
  collecting: () => void,
  dragging: () => void,
  dropping: (reason: DropReason) => void,
  resting: () => void,
  styleContext: string,
  unmount: () => void,
  mount: () => void,
|}
