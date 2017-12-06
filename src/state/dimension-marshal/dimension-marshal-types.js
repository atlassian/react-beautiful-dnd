// @flow
import type { DraggableId, DroppableId, TypeId } from '../../types';

export type Marshal = {|
  // TODO: type correctly
  registerDraggable: Function,
  registerDroppable: Function,
  unregisterDraggable: Function,
  unregisterDroppable: Function,
  start: Function,
  stop: Function,
|}

export type Callbacks = {|

|}
