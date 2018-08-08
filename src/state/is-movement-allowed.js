// @flow
import type { State } from '../types';
// Using function declaration as arrow function does not play well with the %checks syntax
export default function isMovementAllowed(state: State): boolean %checks {
  return (
    state.phase === 'WAITING_FOR_ON_DRAG_START' ||
    state.phase === 'DRAGGING' ||
    state.phase === 'COLLECTING'
  );
}
