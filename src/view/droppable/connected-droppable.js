// @flow
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import memoizeOne from 'memoize-one';
import { storeKey } from '../context-keys';
import {
  dragSelector,
  pendingDropSelector,
  phaseSelector,
  draggingDraggableSelector,
} from '../../state/selectors';
import Droppable from './droppable';
import type {
  Phase,
  PendingDrop,
  DragState,
  State,
  DroppableId,
  DraggableLocation,
  DraggableDimension,
  Placeholder,
} from '../../types';
import type {
  OwnProps,
  MapProps,
  Selector,
} from './droppable-types';

export const makeSelector = (): Selector => {
  const idSelector = (state: State, ownProps: OwnProps) =>
    ownProps.droppableId;
  const isDropDisabledSelector = (state: State, ownProps: OwnProps) =>
    ownProps.isDropDisabled || false;

  const getIsDraggingOver = memoizeOne(
    (id: DroppableId, destination: ?DraggableLocation): boolean => {
      if (!destination) {
        return false;
      }
      return destination.droppableId === id;
    },
  );

  const getPlaceholder = memoizeOne(
    (id: DroppableId,
      source: DraggableLocation,
      destination: ?DraggableLocation,
      draggable: ?DraggableDimension
    ): ?Placeholder => {
      if (!destination) {
        return null;
      }
      // no placeholder needed for this droppable
      if (destination.droppableId !== id) {
        return null;
      }

      // no placeholder needed when dragging over the source list
      if (source.droppableId === destination.droppableId) {
        return null;
      }

      if (!draggable) {
        return null;
      }

      return draggable.placeholder;
    }
  );

  const getMapProps = memoizeOne(
    (isDraggingOver: boolean, placeholder: ?Placeholder): MapProps => ({
      isDraggingOver,
      placeholder,
    })
  );

  return createSelector(
    [phaseSelector,
      dragSelector,
      draggingDraggableSelector,
      pendingDropSelector,
      idSelector,
      isDropDisabledSelector,
    ],
    (phase: Phase,
      drag: ?DragState,
      draggable: ?DraggableDimension,
      pending: ?PendingDrop,
      id: DroppableId,
      isDropDisabled: boolean,
    ): MapProps => {
      if (isDropDisabled) {
        return getMapProps(false, null);
      }

      if (phase === 'DRAGGING') {
        if (!drag) {
          console.error('cannot determine dragging over as there is not drag');
          return getMapProps(false, null);
        }

        const isDraggingOver = getIsDraggingOver(id, drag.impact.destination);

        const placeholder: ?Placeholder = getPlaceholder(
          id,
          drag.initial.source,
          drag.impact.destination,
          draggable
        );
        return getMapProps(isDraggingOver, placeholder);
      }

      if (phase === 'DROP_ANIMATING') {
        if (!pending) {
          console.error('cannot determine dragging over as there is no pending result');
          return getMapProps(false, null);
        }

        const isDraggingOver = getIsDraggingOver(id, pending.impact.destination);
        const placeholder: ?Placeholder = getPlaceholder(
          id,
          pending.result.source,
          pending.result.destination,
          draggable
        );
        return getMapProps(isDraggingOver, placeholder);
      }

      return getMapProps(false, null);
    },
  );
};

const makeMapStateToProps = () => {
  const selector = makeSelector();
  return (state: State, props: OwnProps) => selector(state, props);
};

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Droppable`
// $ExpectError - no idea how to type this correctly
export default connect(
  // returning a function to ensure each
  // Droppable gets its own selector
  makeMapStateToProps,
  null,
  null,
  { storeKey },
)(Droppable);

