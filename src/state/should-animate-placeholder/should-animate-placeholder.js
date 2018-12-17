// @flow
import type { State, DroppableId } from '../../types';

export default (state: State, id: DroppableId): boolean => {
  // when over foreign list - always animate during a drag

  if (state.isDragging) {
    const isHome: boolean = id === state.critical.droppable.id;
    return isHome ? state.shouldAnimateHomePlaceholder : true;
  }

  if (state.phase === 'DROP_ANIMATING') {
    const isHome: boolean = id === state.pending.result.source.droppableId;
    return isHome ? state.shouldAnimateHomePlaceholder : true;
  }

  return false;
};
