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
  DraggableDimension,
  Placeholder,
  GroupingImpact,
} from '../../types';
import type {
  OwnProps,
  DefaultProps,
  MapProps,
  Selector,
} from './droppable-types';

const getIsDraggingOver = (
  id: DraggableId,
  destination: ?DraggableLocation,
  group: ?GroupingImpact,
): boolean => {
  // Only want placeholder for foreign lists

  if (destination) {
    return id === destination.droppableId;
  }

  if (group) {
    return id === group.groupingWith.droppableId;
  }

  return false;
};

// Returning a function to ensure each
// Droppable gets its own selector
export const makeMapStateToProps = (): Selector => {
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
    impact: DragImpact,
  ) => {
    const destination: ?DraggableLocation = impact.destination;
    const group: ?GroupingImpact = impact.group;
    const isHomeList = id === draggable.descriptor.id;
    const placeholder: ?Placeholder = isHomeList ? null : draggable.placeholder;

    const isDraggingOver: boolean = getIsDraggingOver(id, destination, group);

    return isDraggingOver
      ? getMapProps(true, draggable.descriptor.id, placeholder)
      : getDefault();
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
