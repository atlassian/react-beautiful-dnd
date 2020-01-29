// @flow
// eslint-disable-next-line no-unused-vars
import { Component } from 'react';
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import { invariant } from '../../invariant';
import type {
  State,
  DroppableId,
  DraggableId,
  CompletedDrag,
  DraggableDimension,
  DimensionMap,
  TypeId,
  Critical,
  DraggableRubric,
  DraggableDescriptor,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DefaultProps,
  Selector,
  DispatchProps,
  StateSnapshot,
  UseClone,
  DraggableChildrenFn,
} from './droppable-types';
import Droppable from './droppable';
import isStrictEqual from '../is-strict-equal';
import whatIsDraggedOver from '../../state/droppable/what-is-dragged-over';
import { updateViewportMaxScroll as updateViewportMaxScrollAction } from '../../state/action-creators';
import StoreContext from '../context/store-context';
import whatIsDraggedOverFromResult from '../../state/droppable/what-is-dragged-over-from-result';

const isMatchingType = (type: TypeId, critical: Critical): boolean =>
  type === critical.droppable.type;

const getDraggable = (
  critical: Critical,
  dimensions: DimensionMap,
): DraggableDimension => dimensions.draggables[critical.draggable.id];

// Returning a function to ensure each
// Droppable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const idleWithAnimation: MapProps = {
    placeholder: null,
    shouldAnimatePlaceholder: true,
    snapshot: {
      isDraggingOver: false,
      draggingOverWith: null,
      draggingFromThisWith: null,
      isUsingPlaceholder: false,
    },
    useClone: null,
  };

  const idleWithoutAnimation = {
    ...idleWithAnimation,
    shouldAnimatePlaceholder: false,
  };

  const getDraggableRubric = memoizeOne(
    (descriptor: DraggableDescriptor): DraggableRubric => ({
      draggableId: descriptor.id,
      type: descriptor.type,
      source: {
        index: descriptor.index,
        droppableId: descriptor.droppableId,
      },
    }),
  );

  const getMapProps = memoizeOne(
    (
      id: DroppableId,
      isEnabled: boolean,
      isDraggingOverForConsumer: boolean,
      isDraggingOverForImpact: boolean,
      dragging: DraggableDimension,
      // snapshot: StateSnapshot,
      renderClone: ?DraggableChildrenFn,
    ): MapProps => {
      const draggableId: DraggableId = dragging.descriptor.id;
      const isHome: boolean = dragging.descriptor.droppableId === id;

      if (isHome) {
        const useClone: ?UseClone = renderClone
          ? {
              render: renderClone,
              dragging: getDraggableRubric(dragging.descriptor),
            }
          : null;

        const snapshot: StateSnapshot = {
          isDraggingOver: isDraggingOverForConsumer,
          draggingOverWith: isDraggingOverForConsumer ? draggableId : null,
          draggingFromThisWith: draggableId,
          isUsingPlaceholder: true,
        };

        return {
          placeholder: dragging.placeholder,
          shouldAnimatePlaceholder: false,
          snapshot,
          useClone,
        };
      }

      if (!isEnabled) {
        return idleWithoutAnimation;
      }

      // not over foreign list - return idle
      if (!isDraggingOverForImpact) {
        return idleWithAnimation;
      }

      const snapshot: StateSnapshot = {
        isDraggingOver: isDraggingOverForConsumer,
        draggingOverWith: draggableId,
        draggingFromThisWith: null,
        isUsingPlaceholder: true,
      };

      return {
        placeholder: dragging.placeholder,
        // Animating placeholder in foreign list
        shouldAnimatePlaceholder: true,
        snapshot,
        useClone: null,
      };
    },
  );

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    // not checking if item is disabled as we need the home list to display a placeholder

    const id: DroppableId = ownProps.droppableId;
    const type: TypeId = ownProps.type;
    const isEnabled: boolean = !ownProps.isDropDisabled;
    const renderClone: ?DraggableChildrenFn = ownProps.renderClone;

    if (state.isDragging) {
      const critical: Critical = state.critical;
      if (!isMatchingType(type, critical)) {
        return idleWithoutAnimation;
      }

      const dragging: DraggableDimension = getDraggable(
        critical,
        state.dimensions,
      );
      const isDraggingOver: boolean = whatIsDraggedOver(state.impact) === id;

      return getMapProps(
        id,
        isEnabled,
        isDraggingOver,
        isDraggingOver,
        dragging,
        renderClone,
      );
    }

    if (state.phase === 'DROP_ANIMATING') {
      const completed: CompletedDrag = state.completed;
      if (!isMatchingType(type, completed.critical)) {
        return idleWithoutAnimation;
      }

      const dragging: DraggableDimension = getDraggable(
        completed.critical,
        state.dimensions,
      );

      // Snapshot based on result and not impact
      // The result might be null (cancel) but the impact is populated
      // to move everything back
      return getMapProps(
        id,
        isEnabled,
        whatIsDraggedOverFromResult(completed.result) === id,
        whatIsDraggedOver(completed.impact) === id,
        dragging,
        renderClone,
      );
    }

    if (state.phase === 'IDLE' && state.completed && !state.shouldFlush) {
      const completed: CompletedDrag = state.completed;
      if (!isMatchingType(type, completed.critical)) {
        return idleWithoutAnimation;
      }

      // Looking at impact as this controls the placeholder
      const wasOver: boolean = whatIsDraggedOver(completed.impact) === id;
      const wasCombining: boolean = Boolean(
        completed.impact.at && completed.impact.at.type === 'COMBINE',
      );
      const isHome: boolean = completed.critical.droppable.id === id;

      if (wasOver) {
        // if reordering we need to cut an animation immediately
        // if merging: animate placeholder closed after drop
        return wasCombining ? idleWithAnimation : idleWithoutAnimation;
      }

      // we need to animate the home placeholder closed if it is not
      // being dropped into
      if (isHome) {
        return idleWithAnimation;
      }

      return idleWithoutAnimation;
    }

    // default: including when flushed
    return idleWithoutAnimation;
  };

  return selector;
};

const mapDispatchToProps: DispatchProps = {
  updateViewportMaxScroll: updateViewportMaxScrollAction,
};

function getBody(): HTMLElement {
  invariant(document.body, 'document.body is not ready');
  return document.body;
}

const defaultProps = ({
  mode: 'standard',
  type: 'DEFAULT',
  direction: 'vertical',
  isDropDisabled: false,
  isCombineEnabled: false,
  ignoreContainerClipping: false,
  renderClone: null,
  getContainerForClone: getBody,
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
const ConnectedDroppable: typeof DroppableType = connect(
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  // no dispatch props for droppable
  mapDispatchToProps,
  // mergeProps - using default
  null,
  // $FlowFixMe: current react-redux type does not know about context property
  {
    // Ensuring our context does not clash with consumers
    context: StoreContext,
    // pure: true is default value, but being really clear
    pure: true,
    // When pure, compares the result of mapStateToProps to its previous value.
    // Default value: shallowEqual
    // Switching to a strictEqual as we return a memoized object on changes
    areStatePropsEqual: isStrictEqual,
  },
)(Droppable);

ConnectedDroppable.defaultProps = defaultProps;

export default ConnectedDroppable;
