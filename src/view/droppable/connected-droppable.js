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
  DraggableDimension,
  Placeholder,
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

const defaultMapProps: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  draggingFromList: null,
  placeholder: null,
  // we return `true` as the default.
  // if we used `false` we would need to re-render the Droppable when a drag ends
  shouldAnimatePlaceholder: true,
};

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
      return defaultMapProps;
    }

    // showing a placeholder in the home list during a drag to prevent
    // other lists from being shifted on the page.
    // we animate the placeholder closed during a drop animation
    if (isDropAnimating) {
      return defaultMapProps;
    }
    return getHomeNotDraggedOverMapProps(
      // this is the home list so we can use the draggable
      draggable.descriptor.id,
      draggable.placeholder,
    );
  };

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    if (ownProps.isDropDisabled) {
      return defaultMapProps;
    }

    const id: DroppableId = ownProps.droppableId;

    if (state.isDragging) {
      const draggable: DraggableDimension =
        state.dimensions.draggables[state.critical.draggable.id];
      return getMapProps(
        id,
        draggable,
        state.impact,
        false,
        state.shouldAnimatePlaceholder,
      );
    }

    if (state.phase === 'DROP_ANIMATING') {
      const draggable: DraggableDimension =
        state.dimensions.draggables[state.critical.draggable.id];
      return getMapProps(id, draggable, state.pending.impact, true, true);
    }

    return defaultMapProps;
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
