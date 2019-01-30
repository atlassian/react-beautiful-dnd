// @flow
import type { State } from '../types';

export default function isDraggingOrDropping(state: State): boolean %checks {
  return state.isDragging || state.phase === 'DROP_ANIMATING';
}
