// @flow
import type { State, DraggingState } from '../../types';

export type AutoScroller = {|
  start: (state: DraggingState) => void,
  stop: () => void,
  scroll: (state: State) => void,
|};
