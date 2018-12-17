// @flow
import type { State, DroppableId } from '../../types';

export default (state: State, id: DroppableId): boolean => {
  if (!state.isDragging || !state.phase === 'DROP_ANIMATING') {
    return false;
  }

  const isHome: boolean = id === state.critical.droppable.id;

  // when over foreign list - always animate during a drag
  if (!isHome) {
    return true;
  }

  return state.shouldAnimateHomePlaceholder;
};
