// @flow
import { type Position } from 'css-box-model';
import { type Node } from 'react';
import memoizeOne from 'memoize-one';
import { connect } from 'react-redux';
import Draggable from './draggable';
import { storeKey } from '../context-keys';
import { negate } from '../../state/position';
import getDisplacementMap, { type DisplacementMap } from '../../state/get-displacement-map';
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
  Displacement,
  PendingDrop,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DefaultProps,
  DispatchProps,
  Selector,
} from './draggable-types';

const origin: Position = { x: 0, y: 0 };

const defaultMapProps: MapProps = {
  isDropAnimating: false,
  isDragging: false,
  offset: origin,
  shouldAnimateDragMovement: false,
  // This is set to true by default so that as soon as Draggable
  // needs to be displaced it can without needing to change this flag
  shouldAnimateDisplacement: true,
  // these properties are only populated when the item is dragging
  dimension: null,
  draggingOver: null,
};

// Returning a function to ensure each
// Draggable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const memoizedOffset = memoizeOne(
    (x: number, y: number): Position => ({
      x, y,
    }),
  );

  const getNotDraggingProps = memoizeOne(
    (offset: Position, shouldAnimateDisplacement: boolean): MapProps => ({
      isDropAnimating: false,
      isDragging: false,
      offset,
      shouldAnimateDisplacement,
      // not relevant
      shouldAnimateDragMovement: false,
      dimension: null,
      draggingOver: null,
    }),
  );

  const getDraggingProps = memoizeOne((
    offset: Position,
    shouldAnimateDragMovement: boolean,
    dimension: DraggableDimension,
    // the id of the droppable you are over
    draggingOver: ?DroppableId,
  ): MapProps => ({
    isDragging: true,
    isDropAnimating: false,
    shouldAnimateDisplacement: false,
    offset,
    shouldAnimateDragMovement,
    dimension,
    draggingOver,
  }));

  const getOutOfTheWayMovement = (id: DraggableId, movement: DragMovement): ?MapProps => {
    // Doing this cuts 50% of the time to move
    // Otherwise need to loop over every item in every selector (yuck!)
    const map: DisplacementMap = getDisplacementMap(movement.displaced);
    const displacement: ?Displacement = map[id];

    // does not need to move
    if (!displacement) {
      return null;
    }

    // do not need to do anything
    if (!displacement.isVisible) {
      return null;
    }

    const amount: Position = movement.isBeyondStartPosition ?
      negate(movement.amount) :
      movement.amount;

    return getNotDraggingProps(
      memoizedOffset(amount.x, amount.y),
      displacement.shouldAnimate
    );
  };

  const draggingSelector = (state: State, ownProps: OwnProps): ?MapProps => {
    // Dragging
    if (state.phase === 'DRAGGING' ||
      state.phase === 'BULK_COLLECTING' ||
      state.phase === 'DROP_PENDING') {
      // not the dragging item
      if (state.critical.draggable.id !== ownProps.draggableId) {
        return null;
      }

      const offset: Position = state.current.client.offset;
      const dimension: DraggableDimension = state.dimensions.draggables[ownProps.draggableId];
      const shouldAnimateDragMovement: boolean = state.shouldAnimate;
      const draggingOver: ?DroppableId = state.impact.destination ?
        state.impact.destination.droppableId :
        null;

      return getDraggingProps(
        memoizedOffset(offset.x, offset.y),
        shouldAnimateDragMovement,
        dimension,
        draggingOver,
      );
    }

    // Dropping
    if (state.phase === 'DROP_ANIMATING') {
      const pending: PendingDrop = state.pending;
      if (pending.result.draggableId !== ownProps.draggableId) {
        return null;
      }

      const draggingOver: ?DroppableId = pending.result.destination ?
        pending.result.destination.droppableId : null;

      // not memoized as it is the only execution
      return {
        isDragging: false,
        isDropAnimating: true,
        offset: pending.newHomeOffset,
        // still need to provide the dimension for the placeholder
        dimension: state.dimensions.draggables[ownProps.draggableId],
        draggingOver,
        // animation will be controlled by the isDropAnimating flag
        shouldAnimateDragMovement: false,
        // not relevant,
        shouldAnimateDisplacement: false,
      };
    }

    return null;
  };

  const movingOutOfTheWaySelector = (state: State, ownProps: OwnProps): ?MapProps => {
    // Dragging
    if (
      state.phase === 'DRAGGING' ||
      state.phase === 'BULK_COLLECTING' ||
      state.phase === 'DROP_PENDING') {
      // we do not care about the dragging item
      if (state.critical.draggable.id === ownProps.draggableId) {
        return null;
      }

      return getOutOfTheWayMovement(ownProps.draggableId, state.impact.movement);
    }

    // Dropping
    if (state.phase === 'DROP_ANIMATING') {
      // do nothing if this was the dragging item
      if (state.pending.result.draggableId === ownProps.draggableId) {
        return null;
      }

      return getOutOfTheWayMovement(ownProps.draggableId, state.pending.impact.movement);
    }

    // Otherwise
    return null;
  };

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    const dragging: ?MapProps = draggingSelector(state, ownProps);
    if (dragging) {
      return dragging;
    }
    const movingOutOfTheWay: ?MapProps = movingOutOfTheWaySelector(state, ownProps);
    if (movingOutOfTheWay) {
      return movingOutOfTheWay;
    }
    return defaultMapProps;
  };

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

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Draggable`
const ConnectedDraggable: OwnProps => Node = (connect(
  makeMapStateToProps,
  (mapDispatchToProps: any),
  null,
  { storeKey },
): any)(Draggable);

ConnectedDraggable.defaultProps = ({
  isDragDisabled: false,
  // cannot drag interactive elements by default
  disableInteractiveElementBlocking: false,
}: DefaultProps);

export default ConnectedDraggable;
