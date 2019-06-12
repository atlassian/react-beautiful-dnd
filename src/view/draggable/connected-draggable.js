// @flow
import { type Position } from 'css-box-model';
// eslint-disable-next-line
import { Component } from 'react';
import memoizeOne from 'memoize-one';
import { connect } from 'react-redux';
import Draggable from './draggable';
import { origin, negate } from '../../state/position';
import isStrictEqual from '../is-strict-equal';
import { curves, combine } from '../../animation';
import { dropAnimationFinished as dropAnimationFinishedAction } from '../../state/action-creators';
import type {
  State,
  DraggableId,
  DroppableId,
  DraggableDimension,
  Displacement,
  CompletedDrag,
  DragImpact,
  MovementMode,
  DropResult,
  LiftEffect,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DispatchProps,
  Selector,
  StateSnapshot,
  DropAnimation,
} from './draggable-types';
import whatIsDraggedOver from '../../state/droppable/what-is-dragged-over';
import StoreContext from '../context/store-context';
import whatIsDraggedOverFromResult from '../../state/droppable/what-is-dragged-over-from-result';

const getCombineWithFromResult = (result: DropResult): ?DraggableId => {
  return result.combine ? result.combine.draggableId : null;
};

const getCombineWithFromImpact = (impact: DragImpact): ?DraggableId => {
  return impact.at && impact.at.type === 'COMBINE'
    ? impact.at.combine.draggableId
    : null;
};

// Returning a function to ensure each
// Draggable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const getDraggingSnapshot = memoizeOne(
    (
      mode: MovementMode,
      draggingOver: ?DroppableId,
      combineWith: ?DraggableId,
      dropping: ?DropAnimation,
    ): StateSnapshot => ({
      isDragging: true,
      isDropAnimating: Boolean(dropping),
      dropAnimation: dropping,
      mode,
      draggingOver,
      combineWith,
      combineTargetFor: null,
    }),
  );

  const getSecondarySnapshot = memoizeOne(
    (combineTargetFor: ?DraggableId): StateSnapshot => ({
      isDragging: false,
      isDropAnimating: false,
      dropAnimation: null,
      mode: null,
      draggingOver: null,
      combineTargetFor,
      combineWith: null,
    }),
  );

  const defaultMapProps: MapProps = {
    mapped: {
      type: 'SECONDARY',
      offset: origin,
      combineTargetFor: null,
      shouldAnimateDisplacement: true,
      snapshot: getSecondarySnapshot(null),
    },
  };

  const memoizedOffset = memoizeOne((x: number, y: number): Position => ({
    x,
    y,
  }));

  const getDraggingProps = memoizeOne((
    offset: Position,
    mode: MovementMode,
    dimension: DraggableDimension,
    // the id of the droppable you are over
    draggingOver: ?DroppableId,
    // the id of a draggable you are grouping with
    combineWith: ?DraggableId,
    forceShouldAnimate: ?boolean,
  ): MapProps => ({
    mapped: {
      type: 'DRAGGING',
      dropping: null,
      draggingOver,
      combineWith,
      mode,
      offset,
      dimension,
      forceShouldAnimate,
      snapshot: getDraggingSnapshot(mode, draggingOver, combineWith, null),
    },
  }));

  const getSecondaryProps = memoizeOne(
    (
      offset: Position,
      combineTargetFor: ?DraggableId = null,
      shouldAnimateDisplacement: boolean,
    ): MapProps => ({
      mapped: {
        type: 'SECONDARY',
        offset,
        combineTargetFor,
        shouldAnimateDisplacement,
        snapshot: getSecondarySnapshot(combineTargetFor),
      },
    }),
  );

  const getSecondaryMovement = (
    ownId: DraggableId,
    draggingId: DraggableId,
    impact: DragImpact,
    afterCritical: LiftEffect,
  ): ?MapProps => {
    const displacement: ?Displacement = impact.displaced.visible[ownId];
    const isAfterCriticalInVirtualList: boolean = Boolean(
      afterCritical.inVirtualList && afterCritical.effected[ownId],
    );

    console.log('displacement', displacement);
    if (!displacement) {
      if (!isAfterCriticalInVirtualList) {
        return null;
      }

      // when not over a list we close the gap

      const change: Position = negate(afterCritical.displacedBy.point);
      const offset: Position = memoizedOffset(change.x, change.y);
      return getSecondaryProps(offset, null, true);
    }

    if (isAfterCriticalInVirtualList) {
      return null;
    }

    // const merge: ?CombineImpact = impact.merge;
    // const isCombinedWith: boolean = Boolean(
    //   merge && merge.combine.draggableId === ownId,
    // );
    const displaceBy: Position = impact.displacedBy.point;
    const offset: Position = memoizedOffset(displaceBy.x, displaceBy.y);

    // if (isCombinedWith) {
    //   return getSecondaryProps(
    //     displacement ? offset : origin,
    //     draggingId,
    //     displacement ? displacement.shouldAnimate : true,
    //   );
    // }

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
      const combineWith: ?DraggableId = getCombineWithFromImpact(state.impact);
      const forceShouldAnimate: ?boolean = state.forceShouldAnimate;

      return getDraggingProps(
        memoizedOffset(offset.x, offset.y),
        mode,
        dimension,
        draggingOver,
        combineWith,
        forceShouldAnimate,
      );
    }

    // Dropping
    if (state.phase === 'DROP_ANIMATING') {
      const completed: CompletedDrag = state.completed;
      if (completed.result.draggableId !== ownProps.draggableId) {
        return null;
      }

      const dimension: DraggableDimension =
        state.dimensions.draggables[ownProps.draggableId];

      const result: DropResult = completed.result;
      const mode: MovementMode = result.mode;
      // these need to be pulled from the result as they can be different to the final impact
      const draggingOver: ?DroppableId = whatIsDraggedOverFromResult(result);
      const combineWith: ?DraggableId = getCombineWithFromResult(result);
      const duration: number = state.dropDuration;

      // not memoized as it is the only execution
      const dropping: DropAnimation = {
        duration,
        curve: curves.drop,
        moveTo: state.newHomeClientOffset,
        opacity: combineWith ? combine.opacity.drop : null,
        scale: combineWith ? combine.scale.drop : null,
      };

      return {
        mapped: {
          type: 'DRAGGING',
          offset: state.newHomeClientOffset,
          dimension,
          dropping,
          draggingOver,
          combineWith,
          mode,
          forceShouldAnimate: null,
          snapshot: getDraggingSnapshot(
            mode,
            draggingOver,
            combineWith,
            dropping,
          ),
        },
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
        state.afterCritical,
      );
    }

    // Dropping
    if (state.phase === 'DROP_ANIMATING') {
      const completed: CompletedDrag = state.completed;
      // do nothing if this was the dragging item
      if (completed.result.draggableId === ownProps.draggableId) {
        return null;
      }
      return getSecondaryMovement(
        ownProps.draggableId,
        completed.result.draggableId,
        completed.impact,
        completed.afterCritical,
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
  dropAnimationFinished: dropAnimationFinishedAction,
};

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Draggable`
const ConnectedDraggable = connect(
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  mapDispatchToProps,
  // mergeProps: use default
  null,
  // options
  {
    // Using our own context for the store to avoid clashing with consumers
    context: StoreContext,
    // Default value, but being really clear
    pure: true,
    // When pure, compares the result of mapStateToProps to its previous value.
    // Default value: shallowEqual
    // Switching to a strictEqual as we return a memoized object on changes
    areStatePropsEqual: isStrictEqual,
  },
)(Draggable);

export default ConnectedDraggable;
