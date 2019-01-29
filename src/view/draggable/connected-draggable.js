// @flow
import { type Position } from 'css-box-model';
// eslint-disable-next-line
import { Component } from 'react';
import memoizeOne from 'memoize-one';
import { connect } from 'react-redux';
import Draggable from './draggable';
import { storeKey } from '../context-keys';
import { origin } from '../../state/position';
import isStrictEqual from '../is-strict-equal';
import { curves, combine } from '../animation';
import {
  lift as liftAction,
  move as moveAction,
  moveUp as moveUpAction,
  moveDown as moveDownAction,
  moveLeft as moveLeftAction,
  moveRight as moveRightAction,
  drop as dropAction,
  dropAnimationFinished as dropAnimationFinishedAction,
  moveByWindowScroll as moveByWindowScrollAction,
} from '../../state/action-creators';
import type {
  State,
  DraggableId,
  DroppableId,
  DragMovement,
  DraggableDimension,
  CombineImpact,
  Displacement,
  PendingDrop,
  DragImpact,
  DisplacementMap,
  MovementMode,
  Placeholder,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DefaultProps,
  DispatchProps,
  Selector,
} from './draggable-types';
import whatIsDraggedOver from '../../state/droppable/what-is-dragged-over';

const getCombineWith = (impact: DragImpact): ?DraggableId => {
  if (!impact.merge) {
    return null;
  }
  return impact.merge.combine.draggableId;
};

const defaultMapProps: MapProps = {
  secondary: {
    offset: origin,
    combineTargetFor: null,
    shouldAnimateDisplacement: true,
  },
  dragging: null,
};

const getPlaceholder = (
  draggable: DraggableDimension,
  draggingOver: ?DroppableId,
): ?Placeholder => {
  // Show the Draggable placeholder when:
  // 1. over the home droppable OR
  // 2. when not over any droppable
  const shouldShow: boolean =
    draggingOver === draggable.descriptor.droppableId || draggingOver === null;

  return shouldShow ? draggable.placeholder : null;
};

// Returning a function to ensure each
// Draggable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const memoizedOffset = memoizeOne(
    (x: number, y: number): Position => ({ x, y }),
  );

  const getSecondaryProps = memoizeOne(
    (
      offset: Position,
      combineTargetFor: ?DraggableId = null,
      shouldAnimateDisplacement: boolean,
    ): MapProps => ({
      secondary: {
        offset,
        combineTargetFor,
        shouldAnimateDisplacement,
      },
      dragging: null,
    }),
  );

  const getDraggingProps = memoizeOne(
    (
      offset: Position,
      mode: MovementMode,
      dimension: DraggableDimension,
      // the id of the droppable you are over
      draggingOver: ?DroppableId,
      // the id of a draggable you are grouping with
      combineWith: ?DraggableId,
      placeholder: ?Placeholder,
      shouldAnimatePlaceholder: boolean,
      forceShouldAnimate: ?boolean,
    ): MapProps => ({
      dragging: {
        mode,
        dropping: null,
        offset,
        dimension,
        draggingOver,
        combineWith,
        placeholder,
        shouldAnimatePlaceholder,
        forceShouldAnimate,
      },
      secondary: null,
    }),
  );

  const getSecondaryMovement = (
    ownId: DraggableId,
    draggingId: DraggableId,
    impact: DragImpact,
  ): ?MapProps => {
    // Doing this cuts 50% of the time to move
    // Otherwise need to loop over every item in every selector (yuck!)
    const map: DisplacementMap = impact.movement.map;
    const displacement: ?Displacement = map[ownId];
    const movement: DragMovement = impact.movement;
    const merge: ?CombineImpact = impact.merge;
    const isCombinedWith: boolean = Boolean(
      merge && merge.combine.draggableId === ownId,
    );
    const displacedBy: Position = movement.displacedBy.point;
    const offset: Position = memoizedOffset(displacedBy.x, displacedBy.y);

    if (isCombinedWith) {
      return getSecondaryProps(
        displacement ? offset : origin,
        draggingId,
        displacement ? displacement.shouldAnimate : true,
      );
    }

    // does not need to move
    if (!displacement) {
      return null;
    }

    // do not need to do anything
    if (!displacement.isVisible) {
      return null;
    }

    return getSecondaryProps(offset, null, displacement.shouldAnimate);
  };

  const draggingSelector = (state: State, ownProps: OwnProps): ?MapProps => {
    // Dragging
    if (state.isDragging) {
      // not the dragging item
      if (state.critical.draggable.id !== ownProps.draggableId) {
        return null;
      }

      const offset: Position = state.current.client.offset;
      const dimension: DraggableDimension =
        state.dimensions.draggables[ownProps.draggableId];
      // const shouldAnimateDragMovement: boolean = state.shouldAnimate;
      const mode: MovementMode = state.movementMode;
      const draggingOver: ?DroppableId = whatIsDraggedOver(state.impact);
      const combineWith: ?DraggableId = getCombineWith(state.impact);
      const shouldAnimatePlaceholder: boolean =
        state.shouldAnimateDraggablePlaceholder;
      const forceShouldAnimate: ?boolean = state.forceShouldAnimate;

      return getDraggingProps(
        memoizedOffset(offset.x, offset.y),
        mode,
        dimension,
        draggingOver,
        combineWith,
        getPlaceholder(dimension, draggingOver),
        shouldAnimatePlaceholder,
        forceShouldAnimate,
      );
    }

    // Dropping
    if (state.phase === 'DROP_ANIMATING') {
      const pending: PendingDrop = state.pending;
      if (pending.result.draggableId !== ownProps.draggableId) {
        return null;
      }

      const dimension: DraggableDimension =
        state.dimensions.draggables[ownProps.draggableId];
      const draggingOver: ?DroppableId = whatIsDraggedOver(pending.impact);
      const combineWith: ?DraggableId = getCombineWith(pending.impact);
      const duration: number = pending.dropDuration;
      const mode: MovementMode = pending.result.mode;
      const placeholder: ?Placeholder = getPlaceholder(dimension, draggingOver);
      const shouldAnimatePlaceholder: boolean =
        state.shouldAnimateDraggablePlaceholder;

      // not memoized as it is the only execution
      return {
        dragging: {
          offset: pending.newHomeClientOffset,
          dimension,
          placeholder,
          draggingOver,
          combineWith,
          mode,
          shouldAnimatePlaceholder,
          forceShouldAnimate: null,
          dropping: {
            duration,
            curve: curves.drop,
            moveTo: pending.newHomeClientOffset,
            opacity: combineWith ? combine.opacity.drop : null,
            scale: combineWith ? combine.scale.drop : null,
          },
        },
        secondary: null,
      };
    }

    return null;
  };

  const secondarySelector = (state: State, ownProps: OwnProps): ?MapProps => {
    // Dragging
    if (state.isDragging) {
      // we do not care about the dragging item
      if (state.critical.draggable.id === ownProps.draggableId) {
        return null;
      }

      return getSecondaryMovement(
        ownProps.draggableId,
        state.critical.draggable.id,
        state.impact,
      );
    }

    // Dropping
    if (state.phase === 'DROP_ANIMATING') {
      // do nothing if this was the dragging item
      if (state.pending.result.draggableId === ownProps.draggableId) {
        return null;
      }
      return getSecondaryMovement(
        ownProps.draggableId,
        state.pending.result.draggableId,
        state.pending.impact,
      );
    }

    // Otherwise
    return null;
  };

  const selector = (state: State, ownProps: OwnProps): MapProps =>
    draggingSelector(state, ownProps) ||
    secondarySelector(state, ownProps) ||
    defaultMapProps;

  return selector;
};

const mapDispatchToProps: DispatchProps = {
  lift: liftAction,
  move: moveAction,
  moveUp: moveUpAction,
  moveDown: moveDownAction,
  moveLeft: moveLeftAction,
  moveRight: moveRightAction,
  moveByWindowScroll: moveByWindowScrollAction,
  drop: dropAction,
  dropAnimationFinished: dropAnimationFinishedAction,
};

const defaultProps = ({
  isDragDisabled: false,
  // cannot drag interactive elements by default
  disableInteractiveElementBlocking: false,
}: DefaultProps);

// Abstract class allows to specify props and defaults to component.
// All other ways give any or do not let add default props.
// eslint-disable-next-line
/*::
class DraggableType extends Component<OwnProps> {
  static defaultProps = defaultProps;
}
*/

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Draggable`
const ConnectedDraggable: typeof DraggableType = (connect(
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  (mapDispatchToProps: any),
  // mergeProps: use default
  null,
  // options
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
    // $FlowFixMe - incorrect type signature
    areStatePropsEqual: isStrictEqual,
  },
): any)(Draggable);

ConnectedDraggable.defaultProps = defaultProps;

export default ConnectedDraggable;
