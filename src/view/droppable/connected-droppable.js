// @flow
import invariant from 'tiny-invariant';
// eslint-disable-next-line no-unused-vars
import { Component } from 'react';
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import type {
  State,
  DroppableId,
  DraggableId,
  CompletedDrag,
  DraggableDimension,
  DimensionMap,
  TypeId,
  Critical,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DefaultProps,
  Selector,
  DispatchProps,
  StateSnapshot,
  UseClone,
  RenderClone,
} from './droppable-types';
import Droppable from './droppable';
import isStrictEqual from '../is-strict-equal';
import whatIsDraggedOver from '../../state/droppable/what-is-dragged-over';
import { updateViewportMaxScroll as updateViewportMaxScrollAction } from '../../state/action-creators';
import StoreContext from '../context/store-context';
import whatIsDraggedOverFromResult from '../../state/droppable/what-is-dragged-over-from-result';
import getHomeLocation from '../../state/get-home-location';

const isMatchingType = (type: TypeId, critical: Critical): boolean =>
  type === critical.droppable.type;

const getDraggable = (
  critical: Critical,
  dimensions: DimensionMap,
): DraggableDimension => dimensions.draggables[critical.draggable.id];

// Returning a function to ensure each
// Droppable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const idle: MapProps = {
    placeholder: null,
    shouldAnimatePlaceholder: true,
    snapshot: {
      isDraggingOver: false,
      draggingOverWith: null,
      draggingFromThisWith: null,
    },
    useClone: null,
  };

  const idleWithoutAnimation = {
    ...idle,
    shouldAnimatePlaceholder: false,
  };

  const getMapProps = memoizeOne(
    (
      id: DroppableId,
      isDraggingOver: boolean,
      dragging: DraggableDimension,
      snapshot: StateSnapshot,
      whenDraggingClone: ?RenderClone,
    ): MapProps => {
      const isHome: boolean = dragging.descriptor.droppableId === id;

      if (isHome) {
        const useClone: ?UseClone = whenDraggingClone
          ? {
              render: whenDraggingClone,
              draggableId: dragging.descriptor.id,
              source: getHomeLocation(dragging.descriptor),
            }
          : null;

        return {
          placeholder: dragging.placeholder,
          shouldAnimatePlaceholder: false,
          snapshot,
          useClone,
        };
      }

      // not over foreign list - return idle
      if (!isDraggingOver) {
        return idle;
      }

      return {
        placeholder: dragging.placeholder,
        // Animating placeholder in foreign list
        shouldAnimatePlaceholder: true,
        snapshot,
        useClone: null,
      };
    },
  );

  const getSnapshot = memoizeOne(
    (
      id: DroppableId,
      isDraggingOver: boolean,
      dragging: DraggableDimension,
    ): StateSnapshot => {
      const draggableId: DraggableId = dragging.descriptor.id;
      const isHome: boolean = dragging.descriptor.droppableId === id;
      const draggingOverWith: ?DraggableId = isDraggingOver
        ? draggableId
        : null;
      const draggingFromThisWith: ?DraggableId = isHome ? draggableId : null;

      return {
        isDraggingOver,
        draggingOverWith,
        draggingFromThisWith,
      };
    },
  );

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    // not checking if item is disabled as we need the home list to display a placeholder

    const id: DroppableId = ownProps.droppableId;
    const type: TypeId = ownProps.type;
    const whenDraggingClone: ?RenderClone = ownProps.whenDraggingClone;

    if (state.isDragging) {
      const critical: Critical = state.critical;
      if (!isMatchingType(type, critical)) {
        return idle;
      }

      const dragging: DraggableDimension = getDraggable(
        critical,
        state.dimensions,
      );
      const isDraggingOver: boolean = whatIsDraggedOver(state.impact) === id;

      // Snapshot based on current impact
      const snapshot: StateSnapshot = getSnapshot(id, isDraggingOver, dragging);
      return getMapProps(
        id,
        isDraggingOver,
        dragging,
        snapshot,
        whenDraggingClone,
      );
    }

    if (state.phase === 'DROP_ANIMATING') {
      const completed: CompletedDrag = state.completed;
      if (!isMatchingType(type, completed.critical)) {
        return idle;
      }

      const dragging: DraggableDimension = getDraggable(
        completed.critical,
        state.dimensions,
      );

      // Snapshot based on result and not impact
      // The result might be null (cancel) but the impact is populated
      // to move everything back
      const snapshot: StateSnapshot = getSnapshot(
        id,
        whatIsDraggedOverFromResult(completed.result) === id,
        dragging,
      );

      return getMapProps(
        id,
        whatIsDraggedOver(completed.impact) === id,
        dragging,
        snapshot,
        whenDraggingClone,
      );
    }

    // An error occurred and we need to clear everything
    // TODO: validate and add test
    if (state.phase === 'IDLE' && !state.completed && state.shouldFlush) {
      return idleWithoutAnimation;
    }

    if (state.phase === 'IDLE' && state.completed) {
      const completed: CompletedDrag = state.completed;
      if (!isMatchingType(type, completed.critical)) {
        return idle;
      }

      // Looking at impact as this controls the placeholder
      const wasOver: boolean = whatIsDraggedOver(completed.impact) === id;
      const wasCombining: boolean = Boolean(
        completed.impact.at && completed.impact.at.type === 'COMBINE',
      );

      // need to cut any animations: sadly a memoization fail
      // we need to do this for all lists as there might be
      // lists that are still animating a placeholder closed
      if (state.shouldFlush) {
        return idleWithoutAnimation;
      }

      if (wasOver) {
        // if reordering we need to cut an animation immediately
        // if merging: animate placeholder closed after drop
        return wasCombining ? idle : idleWithoutAnimation;
      }

      // keep default value
      return idle;
    }

    return idle;
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
  type: 'DEFAULT',
  direction: 'vertical',
  isDropDisabled: false,
  isCombineEnabled: false,
  ignoreContainerClipping: false,
  whenDraggingClone: null,
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
const ConnectedDroppable: typeof DroppableType = (connect(
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  // no dispatch props for droppable
  mapDispatchToProps,
  // mergeProps - using default
  null,
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
): any)(Droppable);

ConnectedDroppable.defaultProps = defaultProps;

export default ConnectedDroppable;
