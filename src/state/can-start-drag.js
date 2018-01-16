// @flow
import type {
  State, Phase, DraggableId,
} from '../types';

export default (state: State, id: DraggableId): boolean => {
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

  // Can lift depending on the type of drop animation
  // - For a user drop we allow the user to drag other Draggables
  //   immediately as items are most likely already in their home
  // - For a cancel items will be moving back to their original position
  //   as such it is a cleaner experience to block them from dragging until
  //   the drop animation is complete. Otherwise they will be grabbing
  //   items not in their original position which can lead to bad visuals
  if (phase === 'DROP_ANIMATING') {
    if (!state.drop || !state.drop.pending) {
      console.error('Invalid state shape for drop animating');
      return false;
    }

    // Not allowing dragging of the dropping draggable
    if (state.drop.pending.result.draggableId === id) {
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
