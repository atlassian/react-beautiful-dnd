// @flow
import type { DraggingState } from '../../types';

export type AutoScroller = {|
  cancel: () => void,
  jumpScroll: (state: DraggingState) => void,
  fluidScroll: (state: DraggingState) => void,
|};
