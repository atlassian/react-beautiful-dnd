// @flow
import type { DraggingState, BulkCollectionState } from '../../types';

type UserDragState = DraggingState | BulkCollectionState;

export type AutoScroller = {|
  cancel: () => void,
  jumpScroll: (state: UserDragState) => void,
  fluidScroll: (state: UserDragState) => void,
|}
