// @flow
import type {
  State, DraggableId,
} from '../types';

export default (state: State, id: DraggableId): boolean => {
  // ready to go
  if (state.phase === 'IDLE' || state.phase === 'DROP_COMPLETE') {
    return true;
  }

  // already dragging something else so cannot lift
  if (state.phase === 'PREPARING' ||
    state.phase === 'DRAGGING' ||
    state.phase === 'BULK_COLLECTING' ||
    state.phase === 'DROP_PENDING') {
    return false;
  }

  // Can lift depending on the type of drop animation
  // - For a user drop we allow the user to drag other Draggables
  //   immediately as items are most likely already in their home
  // - For a cancel items will be moving back to their original position
  //   as such it is a cleaner experience to block them from dragging until
  //   the drop animation is complete. Otherwise they will be grabbing
  //   items not in their original position which can lead to bad visuals
  if (state.phase === 'DROP_ANIMATING') {
    // Not allowing dragging of the dropping draggable
    if (state.pending.result.draggableId === id) {
      return false;
    }

    // if dropping - allow lifting
    // if cancelling - disallow lifting
    return state.pending.result.reason === 'DROP';
  }

  // this should not happen
  console.warn(`unhandled phase ${state.phase} in canLift check`);
  return false;
};
