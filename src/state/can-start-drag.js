// @flow
import type {
  State, Phase,
} from '../types';

export default (state: State): boolean => {
  const phase: Phase = state.phase;

  // ready to go
  if (phase === 'IDLE' || phase === 'DROP_COMPLETE') {
    return true;
  }

  // already dragging something else so cannot lift
  if (phase === 'PREPARING' ||
    phase === 'COLLECTING_INITIAL_DIMENSIONS' ||
    phase === 'DRAGGING') {
    return false;
  }

  // can lift depending on the type of drop animation
  if (phase === 'DROP_ANIMATING') {
    if (!state.drop || !state.drop.pending) {
      console.error('Invalid state shape for drop animating');
      return false;
    }
    // if dropping - allow lifting
    // if cancelling - disallow lifting
    return state.drop.pending.trigger === 'DROP';
  }

  // this should not happen
  console.warn(`unhandled phase ${phase} in canLift check`);
  return false;
};