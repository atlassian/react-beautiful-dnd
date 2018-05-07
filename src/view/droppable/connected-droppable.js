// @flow
import { type Node } from 'react';
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import { storeKey } from '../context-keys';
import Droppable from './droppable';
import type {
  PendingDrop,
  State,
  DroppableId,
  DraggableId,
  DraggableLocation,
  DraggableDimension,
  Placeholder,
} from '../../types';
import type {
  OwnProps,
  DefaultProps,
  MapProps,
  Selector,
} from './droppable-types';

// Returning a function to ensure each
// Droppable gets its own selector
export const makeSelector = (): Selector => {
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
      destination: ?DraggableLocation,
      draggable: ?DraggableDimension
    ): ?Placeholder => {
      // not dragging anything
      if (!draggable) {
        return null;
      }

      // not dragging over any droppable
      if (!destination) {
        return null;
      }

      // no placeholder needed when dragging over the home droppable
      if (id === draggable.descriptor.droppableId) {
        return null;
      }

      // not over this droppable
      if (id !== destination.droppableId) {
        return null;
      }

      return draggable.placeholder;
    }
  );

  const getMapProps = memoizeOne(
    (isDraggingOver: boolean,
      draggingOverWith: ?DraggableId,
      placeholder: ?Placeholder,
    ): MapProps => ({
      isDraggingOver,
      draggingOverWith,
      placeholder,
    })
  );

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    if (ownProps.isDropDisabled) {
      return getMapProps(false, null, null);
    }

    const id: DroppableId = ownProps.droppableId;

    if (state.phase === 'DRAGGING' || state.phase === 'BULK_COLLECTING') {
      const isDraggingOver: boolean = getIsDraggingOver(id, state.impact.destination);
      const draggableId: DraggableId = state.critical.draggable.id;
      const draggingOverWith: ?DraggableId = isDraggingOver ? draggableId : null;

      const placeholder: ?Placeholder = getPlaceholder(
        id,
        state.impact.destination,
        state.dimensions.draggables[draggableId],
      );

      return getMapProps(isDraggingOver, draggingOverWith, placeholder);
    }

    if (state.phase === 'DROP_ANIMATING') {
      const isDraggingOver = getIsDraggingOver(id, state.pending.impact.destination);
      const draggableId: DraggableId = state.pending.result.draggableId;
      const draggingOverWith: ?DraggableId = isDraggingOver ? draggableId : null;

      const placeholder: ?Placeholder = getPlaceholder(
        id,
        state.pending.result.destination,
        state.dimensions.draggables[draggableId],
      );

      return getMapProps(isDraggingOver, draggingOverWith, placeholder);
    }

    return getMapProps(false, null, null);
  };

  return selector;
};

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Droppable`
const connectedDroppable: OwnProps => Node = (connect(
  (makeSelector: any),
  null,
  null,
  { storeKey },
): any)(Droppable);

connectedDroppable.defaultProps = ({
  type: 'DEFAULT',
  isDropDisabled: false,
  direction: 'vertical',
  ignoreContainerClipping: false,
}: DefaultProps);

export default connectedDroppable;
