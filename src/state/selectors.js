// @flow
import type {
  PendingDrop,
  DragState,
  Phase,
  State,
} from '../types';

export const phaseSelector = (state: State): Phase => state.phase;

export const pendingDropSelector = (state: State): ?PendingDrop => {
  if (!state.drop || !state.drop.pending) {
    return null;
  }
  return state.drop.pending;
};

export const dragSelector = (state: State): ?DragState => state.drag;
