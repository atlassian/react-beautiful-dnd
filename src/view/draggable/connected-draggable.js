// @flow
import memoizeOne from 'memoize-one';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import {
  dragSelector,
  pendingDropSelector,
  phaseSelector,
} from '../../state/selectors';
import Draggable from './draggable';
import { storeKey } from '../context-keys';
import { negate } from '../../state/position';
import {
  lift as liftAction,
  move as moveAction,
  moveForward as moveForwardAction,
  moveBackward as moveBackwardAction,
  crossAxisMoveForward as crossAxisMoveForwardAction,
  crossAxisMoveBackward as crossAxisMoveBackwardAction,
  drop as dropAction,
  cancel as cancelAction,
  dropAnimationFinished as dropAnimationFinishedAction,
  moveByWindowScroll as moveByWindowScrollAction,
} from '../../state/action-creators';
import type {
  State,
  Position,
  DraggableId,
  DragMovement,
  DraggableDimension,
  Direction,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DispatchProps,
  Selector,
} from './draggable-types';

const origin: Position = { x: 0, y: 0 };

const defaultMapProps: MapProps = {
  isDropAnimating: false,
  isDragging: false,
  offset: origin,
  shouldAnimateDragMovement: false,

  // these properties are only populated when the item is dragging
  dimension: null,
  direction: null,
};

export const makeSelector = (): Selector => {
  const memoizedOffset = memoizeOne(
    (x: number, y: number): Position => ({
      x, y,
    }),
  );

  const getNotDraggingProps = memoizeOne(
    (offset: Position): MapProps => ({
      isDropAnimating: false,
      isDragging: false,
      offset,
      // not relevant
      shouldAnimateDragMovement: false,
      dimension: null,
      direction: null,
    }),
  );

  const getDraggingProps = memoizeOne((
    offset: Position,
    shouldAnimateDragMovement: boolean,
    dimension: DraggableDimension,
    // direction of the droppable you are over
    direction: ?Direction,
  ): MapProps => ({
    isDragging: true,
    isDropAnimating: false,
    offset,
    shouldAnimateDragMovement,
    dimension,
    direction,
  }));

  const draggingSelector = (state: State, ownProps: OwnProps): ?MapProps => {
    if (state.phase !== 'DRAGGING' && state.phase !== 'DROP_ANIMATING') {
      return null;
    }

    if (state.phase === 'DRAGGING') {
      if (!state.drag) {
        console.error('invalid drag state found in selector');
        return null;
      }

      // not the dragging item
      if (state.drag.initial.descriptor.id !== ownProps.draggableId) {
        return null;
      }

      const offset: Position = state.drag.current.client.offset;
      const dimension: DraggableDimension = state.dimension.draggable[ownProps.draggableId];
      const direction: ?Direction = state.drag.impact.direction;
      const shouldAnimateDragMovement: boolean = state.drag.current.shouldAnimate;

      return getDraggingProps(
        memoizedOffset(offset.x, offset.y),
        shouldAnimateDragMovement,
        dimension,
        direction,
      );
    }

    // dropping

    if (!state.drop || !state.drop.pending) {
      console.error('cannot provide props for dropping item when there is invalid state');
      return null;
    }

    // this was not the dragging item
    if (state.drop.pending.result.draggableId !== ownProps.draggableId) {
      return null;
    }

    // not memoized as it is the only execution
    return {
      isDragging: false,
      isDropAnimating: true,
      offset: state.drop.pending.newHomeOffset,
      // still need to provide the dimension for the placeholder
      dimension: state.dimension.draggable[ownProps.draggableId],
      // direction no longer needed as drag handle is unbound
      direction: null,
      // animation will be controlled by the isDropAnimating flag
      shouldAnimateDragMovement: false,
    };
  };

  const getWithMovement = (id: DraggableId, movement: DragMovement): ?MapProps => {
    const needsToMove = movement.draggables.indexOf(id) !== -1;

    if (!needsToMove) {
      return null;
    }

    const amount: Position = movement.isBeyondStartPosition ?
      negate(movement.amount) :
      movement.amount;

    return getNotDraggingProps(memoizedOffset(amount.x, amount.y));
  };

  const movingOutOfTheWaySelector = (state: State, ownProps: OwnProps): ?MapProps => {
    if (state.phase !== 'DRAGGING' && state.phase !== 'DROP_ANIMATING') {
      return null;
    }

    if (state.phase === 'DRAGGING') {
      if (!state.drag) {
        console.error('cannot correctly move item out of the way when there is invalid state');
        return null;
      }

      // we do not care about the dragging item
      if (state.drag.initial.descriptor.id === ownProps.draggableId) {
        return null;
      }

      const movement: DragMovement = state.drag.impact.movement;
      const needsToMove = movement.draggables.indexOf(ownProps.draggableId) !== -1;

      if (!needsToMove) {
        return null;
      }

      return getWithMovement(ownProps.draggableId, movement);
    }

    // state.phase === 'DROP_ANIMATING'
    if (!state.drop || !state.drop.pending) {
      console.error('cannot provide props for dropping item when there is invalid state');
      return null;
    }

    // do nothing if this was the dragging item
    if (state.drop.pending.result.draggableId === ownProps.draggableId) {
      return null;
    }

    return getWithMovement(ownProps.draggableId, state.drop.pending.impact.movement);
  };

  return createSelector(
    [
      draggingSelector,
      movingOutOfTheWaySelector,
    ],
    (
      dragging: ?MapProps,
      moving: ?MapProps,
    ): MapProps => {
      if (dragging) {
        return dragging;
      }

      if (moving) {
        return moving;
      }

      return defaultMapProps;
    },
  );
};

const makeMapStateToProps = () => {
  const selector: Selector = makeSelector();
  // $FlowFixMe - no idea how to type this correctly
  return (state: State, props: OwnProps) => selector(state, props);
};

const mapDispatchToProps: DispatchProps = {
  lift: liftAction,
  move: moveAction,
  moveForward: moveForwardAction,
  moveBackward: moveBackwardAction,
  crossAxisMoveForward: crossAxisMoveForwardAction,
  crossAxisMoveBackward: crossAxisMoveBackwardAction,
  moveByWindowScroll: moveByWindowScrollAction,
  drop: dropAction,
  dropAnimationFinished: dropAnimationFinishedAction,
  cancel: cancelAction,
};

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Draggable`
export default connect(
  // returning a function to ensure each
  // Draggable gets its own selector
  makeMapStateToProps,
  mapDispatchToProps,
  null,
  { storeKey },
)(Draggable);

