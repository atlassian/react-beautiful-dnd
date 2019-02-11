// @flow
// eslint-disable-next-line
import { Component } from 'react';
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import type {
  State,
  DroppableId,
  DraggableId,
  DragImpact,
  CompletedDrag,
  DraggableDimension,
  DimensionMap,
  Placeholder,
  TypeId,
  Critical,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DefaultProps,
  Selector,
  DispatchProps,
} from './droppable-types';
import { storeKey } from '../context-keys';
import Droppable from './droppable';
import isStrictEqual from '../is-strict-equal';
import whatIsDraggedOver from '../../state/droppable/what-is-dragged-over';
import { updateViewportMaxScroll as updateViewportMaxScrollAction } from '../../state/action-creators';

const withoutAnimation: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  draggingFromList: null,
  placeholder: null,
  shouldAnimatePlaceholder: false,
};

const withAnimation: MapProps = {
  ...withoutAnimation,
  shouldAnimatePlaceholder: true,
};

const isMatchingType = (type: TypeId, critical: Critical): boolean =>
  type === critical.droppable.type;

const shouldCollapseHomeAfterDrag = (
  id: DroppableId,
  completed: CompletedDrag,
): boolean => {
  const isHome: boolean = completed.critical.droppable.id === id;

  if (!isHome) {
    return false;
  }

  // should not animated when dropping into no list (will be returning to home list)
  // should animate collapse when dropping into a foreign list

  const wasOver: ?DroppableId = whatIsDraggedOver(completed.impact);

  return Boolean(wasOver) && wasOver !== id;
};

const getDraggable = (
  critical: Critical,
  dimensions: DimensionMap,
): DraggableDimension => dimensions.draggables[critical.draggable.id];

// Returning a function to ensure each
// Droppable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const getDraggingOverMapProps = memoizeOne(
    (
      draggingOverWith: DraggableId,
      draggingFromList: ?DraggableId,
      placeholder: Placeholder,
      shouldAnimatePlaceholder: boolean,
    ): MapProps => ({
      isDraggingOver: true,
      draggingFromList,
      draggingOverWith,
      placeholder,
      shouldAnimatePlaceholder,
    }),
  );

  const getHomeNotDraggedOverMapProps = memoizeOne(
    (draggingFromList: DraggableId, placeholder: Placeholder): MapProps => ({
      isDraggingOver: false,
      // this is the home list so we need to provide the dragging id
      draggingFromList,
      draggingOverWith: null,
      placeholder,
      shouldAnimatePlaceholder: true,
    }),
  );

  const getMapProps = (
    id: DroppableId,
    draggable: DraggableDimension,
    impact: DragImpact,
    isDropAnimating: boolean,
    shouldAnimatePlaceholder: boolean,
  ): MapProps => {
    const isOver: boolean = whatIsDraggedOver(impact) === id;
    const isHome: boolean = draggable.descriptor.droppableId === id;

    if (isOver) {
      const draggingFromList: ?DraggableId = isHome
        ? draggable.descriptor.id
        : null;
      // When dropping over a list
      if (impact.merge && isDropAnimating) {
        return {
          isDraggingOver: true,
          draggingFromList,
          draggingOverWith: draggable.descriptor.id,
          placeholder: null,
          shouldAnimatePlaceholder: true,
        };
      }

      return getDraggingOverMapProps(
        draggable.descriptor.id,
        draggingFromList,
        draggable.placeholder,
        shouldAnimatePlaceholder,
      );
    }

    // not over the list

    if (!isHome) {
      return withAnimation;
    }

    // showing a placeholder in the home list during a drag to prevent
    // other lists from being shifted on the page.
    // we animate the placeholder closed during a drop animation
    // if (isDropAnimating) {
    //   return withoutAnimation;
    // }
    return getHomeNotDraggedOverMapProps(
      // this is the home list so we can use the draggable
      draggable.descriptor.id,
      draggable.placeholder,
    );
  };

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    if (ownProps.isDropDisabled) {
      return withoutAnimation;
    }

    const id: DroppableId = ownProps.droppableId;
    const type: TypeId = ownProps.type;

    if (state.isDragging) {
      const critical: Critical = state.critical;

      if (!isMatchingType(type, critical)) {
        return withoutAnimation;
      }

      return getMapProps(
        id,
        getDraggable(critical, state.dimensions),
        state.impact,
        false,
        state.shouldAnimatePlaceholder,
      );
    }

    if (state.phase === 'DROP_ANIMATING') {
      const completed: CompletedDrag = state.completed;

      if (!isMatchingType(type, completed.critical)) {
        return withoutAnimation;
      }

      return getMapProps(
        id,
        getDraggable(completed.critical, state.dimensions),
        completed.impact,
        true,
        true,
      );
    }

    if (state.phase === 'IDLE' && state.completed) {
      const completed: CompletedDrag = state.completed;

      if (!isMatchingType(type, completed.critical)) {
        return withoutAnimation;
      }

      if (!shouldCollapseHomeAfterDrag(id, completed)) {
        return withoutAnimation;
      }

      return withAnimation;
    }

    return withoutAnimation;
  };

  return selector;
};

const mapDispatchToProps: DispatchProps = {
  updateViewportMaxScroll: updateViewportMaxScrollAction,
};

const defaultProps = ({
  type: 'DEFAULT',
  direction: 'vertical',
  isDropDisabled: false,
  isCombineEnabled: false,
  ignoreContainerClipping: false,
}: DefaultProps);

// Abstract class allows to specify props and defaults to component.
// All other ways give any or do not let add default props.
// eslint-disable-next-line
/*::
class DroppableType extends Component<OwnProps> {
  static defaultProps = defaultProps;
}
*/

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Droppable`
const ConnectedDroppable: typeof DroppableType = (connect(
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  // no dispatch props for droppable
  mapDispatchToProps,
  // mergeProps - using default
  null,
  {
    // Using our own store key.
    // This allows consumers to also use redux
    // Note: the default store key is 'store'
    storeKey,
    // pure: true is default value, but being really clear
    pure: true,
    // When pure, compares the result of mapStateToProps to its previous value.
    // Default value: shallowEqual
    // Switching to a strictEqual as we return a memoized object on changes
    areStatePropsEqual: isStrictEqual,
  },
): any)(Droppable);

ConnectedDroppable.defaultProps = defaultProps;

export default ConnectedDroppable;
