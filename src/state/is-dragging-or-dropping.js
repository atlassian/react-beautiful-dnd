// @flow
import type { State, TypeId } from '../types';

export default (type: TypeId, state: State): boolean => {
  if (state.isDragging || state.phase === 'DROP_ANIMATING') {
    return state.critical.droppable.type === type;
  }

  return false;
};
