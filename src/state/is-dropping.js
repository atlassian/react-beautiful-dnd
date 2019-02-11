// @flow
import type { State, TypeId } from '../types';

export default (type: TypeId, state: State): boolean =>
  state.phase === 'DROP_ANIMATING' &&
  state.completed.critical.droppable.type === type;
