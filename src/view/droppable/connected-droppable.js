// @flow
import { type Node } from 'react';
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import { storeKey } from '../context-keys';
import Droppable from './droppable';
import isStrictEqual from '../is-strict-equal';
import type {
  State,
  DroppableId,
  DraggableId,
  DraggableLocation,
  DraggableDimension,
  DraggableDescriptor,
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
export const makeMapStateToProps = (): Selector => {
  const getIsDraggingOver = (
    id: DroppableId,
    destination: ?DraggableLocation,
  ): boolean => {
    if (!destination) {
      return false;
    }
    return destination.droppableId === id;
  };

  const shouldUsePlaceholder = (
    id: DroppableId,
    descriptor: DraggableDescriptor,
    destination: ?DraggableLocation,
  ): boolean => {
    if (!destination) {
      return false;
    }

    // Do not use a placeholder when over the home list
    if (id === descriptor.droppableId) {
      return false;
    }

    // TODO: no placeholder if over foreign list
    return id === destination.droppableId;
  };

  const getMapProps = memoizeOne(
    (
      isDraggingOver: boolean,
      draggingOverWith: ?DraggableId,
      placeholder: ?Placeholder,
    ): MapProps => ({
      isDraggingOver,
      draggingOverWith,
      placeholder,
    }),
  );

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    if (ownProps.isDropDisabled) {
      return getMapProps(false, null, null);
    }

    const id: DroppableId = ownProps.droppableId;

    if (state.isDragging && state.hasOnDragStartFinished) {
      const destination: ?DraggableLocation = state.impact.destination;
      const isDraggingOver: boolean = getIsDraggingOver(id, destination);
      const draggableId: DraggableId = state.critical.draggable.id;
      const draggingOverWith: ?DraggableId = isDraggingOver
        ? draggableId
        : null;
      const draggable: DraggableDimension =
        state.dimensions.draggables[draggableId];

      const placeholder: ?Placeholder = shouldUsePlaceholder(
        id,
        draggable.descriptor,
        destination,
      )
        ? draggable.placeholder
        : null;

      return getMapProps(isDraggingOver, draggingOverWith, placeholder);
    }

    if (state.phase === 'DROP_ANIMATING') {
      const destination: ?DraggableLocation = state.pending.impact.destination;
      const isDraggingOver = getIsDraggingOver(id, destination);
      const draggableId: DraggableId = state.pending.result.draggableId;
      const draggingOverWith: ?DraggableId = isDraggingOver
        ? draggableId
        : null;
      const draggable: DraggableDimension =
        state.dimensions.draggables[draggableId];

      const placeholder: ?Placeholder = shouldUsePlaceholder(
        id,
        draggable.descriptor,
        destination,
      )
        ? draggable.placeholder
        : null;

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
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  // mapDispatchToProps - not using
  null,
  // mergeProps - using default
  null,
  {
    // Using our own store key.
    // This allows consumers to also use redux
    // Note: the default store key is 'store'
    storeKey,
    // Default value, but being really clear
    pure: true,
    // When pure, compares the result of mapStateToProps to its previous value.
    // Default value: shallowEqual
    // Switching to a strictEqual as we return a memoized object on changes
    areStatePropsEqual: isStrictEqual,
  },
): any)(Droppable);

connectedDroppable.defaultProps = ({
  type: 'DEFAULT',
  isDropDisabled: false,
  direction: 'vertical',
  ignoreContainerClipping: false,
}: DefaultProps);

export default connectedDroppable;
