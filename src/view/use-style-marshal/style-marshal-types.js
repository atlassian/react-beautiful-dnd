// @flow
import type { DropReason } from '../../types';

export type StyleMarshal = {|
  dragging: () => void,
  dropping: (reason: DropReason) => void,
  resting: () => void,
  styleContext: string,
|};
