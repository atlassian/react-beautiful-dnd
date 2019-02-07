// @flow
import type { State, TypeId } from '../types';

export default (type: TypeId, state: State): boolean =>
  Boolean(state.isDragging && state.critical.droppable.type === type);
