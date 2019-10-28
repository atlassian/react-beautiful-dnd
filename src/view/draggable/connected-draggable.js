// @flow
import { type Position } from 'css-box-model';
// eslint-disable-next-line
import { Component } from 'react';
import memoizeOne from 'memoize-one';
import { connect } from 'react-redux';
import Draggable from './draggable';
import { origin, negate } from '../../state/position';
import isStrictEqual from '../is-strict-equal';
import * as animation from '../../animation';
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
  Combine,
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
import { tryGetCombine } from '../../state/get-impact-location';

const getCombineWithFromResult = (result: DropResult): ?DraggableId => {
  return result.combine ? result.combine.draggableId : null;
};

const getCombineWithFromImpact = (impact: DragImpact): ?DraggableId => {
  return impact.at && impact.at.type === 'COMBINE'
    ? impact.at.combine.draggableId
    : null;
};

type TrySelect = (state: State, ownProps: OwnProps) => ?MapProps;

function getDraggableSelector(): TrySelect {
  const memoizedOffset = memoizeOne((x: number, y: number): Position => ({
    x,
    y,
  }));

  const getMemoizedSnapshot = memoizeOne(
    (
      mode: MovementMode,
      isClone: boolean,
      draggingOver: ?DroppableId,
      combineWith: ?DraggableId,
      dropping: ?DropAnimation,
    ): StateSnapshot => ({
      isDragging: true,
      isClone,
      isDropAnimating: Boolean(dropping),
      dropAnimation: dropping,
      mode,
      draggingOver,
      combineWith,
      combineTargetFor: null,
    }),
  );

  const getMemoizedProps = memoizeOne((
    offset: Position,
    mode: MovementMode,
    dimension: DraggableDimension,
    isClone: boolean,
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
      snapshot: getMemoizedSnapshot(
        mode,
        isClone,
        draggingOver,
        combineWith,
        null,
      ),
    },
  }));

  const selector: TrySelect = (state: State, ownProps: OwnProps): ?MapProps => {
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
      const draggingOver: ?DroppableId = whatIsDraggedOver(state.impact);
      const combineWith: ?DraggableId = getCombineWithFromImpact(state.impact);
      const forceShouldAnimate: ?boolean = state.forceShouldAnimate;

      return getMemoizedProps(
        memoizedOffset(offset.x, offset.y),
        state.movementMode,
        dimension,
        ownProps.isClone,
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

      const isClone: boolean = ownProps.isClone;
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
        curve: animation.curves.drop,
        moveTo: state.newHomeClientOffset,
        opacity: combineWith ? animation.combine.opacity.drop : null,
        scale: combineWith ? animation.combine.scale.drop : null,
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
          snapshot: getMemoizedSnapshot(
            mode,
            isClone,
            draggingOver,
            combineWith,
            dropping,
          ),
        },
      };
    }

    return null;
  };

  return selector;
}

function getSecondarySnapshot(combineTargetFor: ?DraggableId): StateSnapshot {
  return {
    isDragging: false,
    isDropAnimating: false,
    isClone: false,
    dropAnimation: null,
    mode: null,
    draggingOver: null,
    combineTargetFor,
    combineWith: null,
  };
}

const atRest: MapProps = {
  mapped: {
    type: 'SECONDARY',
    offset: origin,
    combineTargetFor: null,
    shouldAnimateDisplacement: true,
    snapshot: getSecondarySnapshot(null),
  },
};

function getSecondarySelector(): TrySelect {
  const memoizedOffset = memoizeOne((x: number, y: number): Position => ({
    x,
    y,
  }));

  const getMemoizedSnapshot = memoizeOne(getSecondarySnapshot);

  const getMemoizedProps = memoizeOne(
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
        snapshot: getMemoizedSnapshot(combineTargetFor),
      },
    }),
  );

  // Is we are the combine target for something then we need to publish that
  // otherwise we will return null to get the default props
  const getFallback = (combineTargetFor: ?DraggableId): ?MapProps => {
    return combineTargetFor
      ? getMemoizedProps(origin, combineTargetFor, true)
      : null;
  };

  const getProps = (
    ownId: DraggableId,
    draggingId: DraggableId,
    impact: DragImpact,
    afterCritical: LiftEffect,
  ): ?MapProps => {
    const visualDisplacement: ?Displacement = impact.displaced.visible[ownId];
    const isAfterCriticalInVirtualList: boolean = Boolean(
      afterCritical.inVirtualList && afterCritical.effected[ownId],
    );

    const combine: ?Combine = tryGetCombine(impact);
    const combineTargetFor: ?DraggableId =
      combine && combine.draggableId === ownId ? draggingId : null;

    if (!visualDisplacement) {
      if (!isAfterCriticalInVirtualList) {
        return getFallback(combineTargetFor);
      }

      // After critical but not visibly displaced in a virtual list
      // This can occur if:
      // 1. the item is not visible (displaced.invisible)
      // 2. We have moved out of the home list.

      // Don't need to do anything - item is invisible
      if (impact.displaced.invisible[ownId]) {
        return null;
      }

      // We are no longer over the home list.
      // We need to move backwards to close the gap that the dragging item has left
      const change: Position = negate(afterCritical.displacedBy.point);
      const offset: Position = memoizedOffset(change.x, change.y);
      return getMemoizedProps(offset, combineTargetFor, true);
    }

    if (isAfterCriticalInVirtualList) {
      // In a virtual list the removal of a dragging item does
      // not cause the list to collapse. So when something is 'displaced'
      // we can just leave it in the original spot.
      return getFallback(combineTargetFor);
    }
    const displaceBy: Position = impact.displacedBy.point;
    const offset: Position = memoizedOffset(displaceBy.x, displaceBy.y);

    return getMemoizedProps(
      offset,
      combineTargetFor,
      visualDisplacement.shouldAnimate,
    );
  };

  const selector: TrySelect = (state: State, ownProps: OwnProps): ?MapProps => {
    // Dragging
    if (state.isDragging) {
      // we do not care about the dragging item
      if (state.critical.draggable.id === ownProps.draggableId) {
        return null;
      }

      return getProps(
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
      return getProps(
        ownProps.draggableId,
        completed.result.draggableId,
        completed.impact,
        completed.afterCritical,
      );
    }

    // Otherwise
    return null;
  };

  return selector;
}

// Returning a function to ensure each
// Draggable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const draggingSelector: TrySelect = getDraggableSelector();
  const secondarySelector: TrySelect = getSecondarySelector();

  const selector = (state: State, ownProps: OwnProps): MapProps =>
    draggingSelector(state, ownProps) ||
    secondarySelector(state, ownProps) ||
    atRest;

  return selector;
};

const mapDispatchToProps: DispatchProps = {
  dropAnimationFinished: dropAnimationFinishedAction,
};

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `<Draggable />`
const ConnectedDraggable = connect(
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  mapDispatchToProps,
  // mergeProps: use default
  null,
  // options
  // $FlowFixMe: current react-redux type does not know about context property
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
