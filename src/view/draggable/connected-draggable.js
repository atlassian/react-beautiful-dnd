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
  DragState,
  PendingDrop,
  Phase,
  DragMovement,
  DraggableDimension,
  CurrentDrag,
  DragImpact,
  DraggableDescriptor,
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
  canLift: true,
  // By default the item will not animate unless instructed to.
  // If animation is enabled then there may be some animation
  // at unexpected points: such as on a DROP_COMPLETE
  canAnimate: false,
  offset: origin,

  // these properties are only populated when the item is dragging
  dimension: null,
  direction: null,
};

// type DraggingResult = {|
//   dimension: DraggableDimension,
//   offset: Position,
//   direction: ?Direction,
// |}

// type MovingResult = {|
//   offset: Position,
// |}

export const makeSelector = (): Selector => {
  const memoizedOffset = memoizeOne(
    (x: number, y: number): Position => ({
      x, y,
    }),
  );

  const getWithMovement = memoizeOne(
    (offset: Position, canLift: boolean): MapProps => ({
      isDropAnimating: false,
      isDragging: false,
      canAnimate: true,
      canLift,
      offset,
      dimension: null,
      direction: null,
    }),
  );

  const getDraggingProps = memoizeOne((
    offset: Position,
    canAnimate: boolean,
    dimension: DraggableDimension,
    // direction of the droppable you are over
    direction: ?Direction,
  ): MapProps => ({
    isDragging: true,
    canLift: false,
    isDropAnimating: false,
    offset,
    canAnimate,
    dimension,
    direction,
  }));

  // TODO: drop animating
  const draggingSelector = (state: State, ownProps: OwnProps): ?MapProps => {
    if (state.phase !== 'DRAGGING') {
      return null;
    }

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

    return getDraggingProps(
      memoizedOffset(offset.x, offset.y),
      // TODO
      true,
      dimension,
      direction,
    );
  };

  const movingOutOfTheWaySelector = (state: State, ownProps: OwnProps): ?MapProps => {
    if (state.phase !== 'DRAGGING') {
      return null;
    }

    if (!state.drag) {
      console.error('cannot correctly move item out of the way when there is invalid state');
      return null;
    }

    const movement: DragMovement = state.drag.impact.movement;

    const needsToMove = movement.draggables.indexOf(ownProps.draggableId) !== -1;

    if (!needsToMove) {
      return null;
    }

    const amount: Position = movement.isBeyondStartPosition ?
      negate(movement.amount) :
      movement.amount;

    return getWithMovement(
      memoizedOffset(amount.x, amount.y),
      // TODO
      true,
    );
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

