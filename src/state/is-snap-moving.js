// @flow
import type { State } from '../types';
import isMovementAllowed from './is-movement-allowed';
// Using function declaration as arrow function does not play well with the %checks syntax
export default function isSnapMoving(state: State): boolean %checks {
  return isMovementAllowed(state) && state.movementMode === 'SNAP';
}
