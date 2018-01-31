// @flow
import { createSelector } from 'reselect';
import type {
  PendingDrop,
  DragState,
  DraggableDimension,
  DraggableDimensionMap,
  Phase,
  State,
} from '../types';
import * as logger from '../log';

export const phaseSelector = (state: State): Phase => state.phase;

export const pendingDropSelector = (state: State): ?PendingDrop => {
  if (!state.drop || !state.drop.pending) {
    return null;
  }
  return state.drop.pending;
};

export const dragSelector = (state: State): ?DragState => state.drag;

const draggableMapSelector = (state: State): DraggableDimensionMap => state.dimension.draggable;

export const draggingDraggableSelector = createSelector([
  phaseSelector,
  dragSelector,
  pendingDropSelector,
  draggableMapSelector,
], (phase: Phase,
  drag: ?DragState,
  pending: ?PendingDrop,
  draggables: DraggableDimensionMap
): ?DraggableDimension => {
  if (phase === 'DRAGGING') {
    if (!drag) {
      logger.error('cannot get placeholder dimensions as there is an invalid drag state');
      return null;
    }

    const draggable: DraggableDimension = draggables[drag.initial.descriptor.id];
    return draggable;
  }

  if (phase === 'DROP_ANIMATING') {
    if (!pending) {
      logger.error('cannot get placeholder dimensions as there is an invalid drag state');
      return null;
    }

    if (!pending.result.destination) {
      return null;
    }

    const draggable: DraggableDimension = draggables[pending.result.draggableId];
    return draggable;
  }

  return null;
}
);
