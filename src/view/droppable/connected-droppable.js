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
  DragImpact,
  DraggableLocation,
  GroupingLocation,
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
  const shouldUsePlaceholder = (
    id: DroppableId,
    descriptor: DraggableDescriptor,
    destination: DraggableLocation | GroupingLocation,
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

  const getDefault = (): MapProps => getMapProps(false, null, null);

  const getDraggingOverProps = (
    id: DroppableId,
    draggable: DraggableDimension,
    impact: ?DragImpact,
  ) => {
    if (!impact) {
      return getDefault();
    }

    const isDraggingOver: boolean =
      impact.destination.droppableId === draggable.descriptor.id;

    if (!isDraggingOver) {
      return getDefault();
    }

    const placeholder: ?Placeholder = shouldUsePlaceholder(
      id,
      draggable.descriptor,
      impact.destination,
    )
      ? draggable.placeholder
      : null;

    return getMapProps(isDraggingOver, draggable.descriptor.id, placeholder);
  };

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    if (ownProps.isDropDisabled) {
      return getDefault();
    }

    const id: DroppableId = ownProps.droppableId;

    if (state.isDragging) {
      const draggable: DraggableDimension =
        state.dimensions.draggables[state.critical.draggable.id];
      return getDraggingOverProps(id, draggable, state.impact);
    }

    if (state.phase === 'DROP_ANIMATING') {
      const draggable: DraggableDimension =
        state.dimensions.draggables[state.pending.result.draggableId];
      return getDraggingOverProps(id, draggable, state.pending.impact);
    }

    return getDefault();
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
  direction: 'vertical',
  isDropDisabled: false,
  isGroupingEnabled: false,
  ignoreContainerClipping: false,
}: DefaultProps);

export default connectedDroppable;
