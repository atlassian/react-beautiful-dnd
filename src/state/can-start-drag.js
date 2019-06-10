// @flow
import type { State, DraggableId } from '../types';

export default (state: State, id: DraggableId): boolean => {
  // Ready to go!
  if (state.phase === 'IDLE') {
    return true;
  }

  // Can lift depending on the type of drop animation
  if (state.phase !== 'DROP_ANIMATING') {
    return false;
  }

  // - For a user drop we allow the user to drag other Draggables
  //   immediately as items are most likely already in their home
  // - For a cancel items will be moving back to their original position
  //   as such it is a cleaner experience to block them from dragging until
  //   the drop animation is complete. Otherwise they will be grabbing
  //   items not in their original position which can lead to bad visuals
  // Not allowing dragging of the dropping draggable
  if (state.completed.result.draggableId === id) {
    return false;
  }

  // if dropping - allow lifting
  // if cancelling - disallow lifting
  return state.completed.result.reason === 'DROP';
};
