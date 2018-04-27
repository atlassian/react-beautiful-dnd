// @flow
import { type Position } from 'css-box-model';
import type { Node } from 'react';
import memoizeOne from 'memoize-one';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Draggable from './draggable';
import { storeKey } from '../context-keys';
import { negate } from '../../state/position';
import getDisplacementMap, { type DisplacementMap } from '../../state/get-displacement-map';
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
  DraggableId,
  DroppableId,
  DragMovement,
  DraggableDimension,
  Direction,
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
  direction: null,
  draggingOver: null,
};

export const makeSelector = (): Selector => {
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
      direction: null,
      draggingOver: null,
    }),
  );

  const getDraggingProps = memoizeOne((
    offset: Position,
    shouldAnimateDragMovement: boolean,
    dimension: DraggableDimension,
    // direction of the droppable you are over
    direction: ?Direction,
    // the id of the droppable you are over
    draggingOver: ?DroppableId,
  ): MapProps => ({
    isDragging: true,
    isDropAnimating: false,
    shouldAnimateDisplacement: false,
    offset,
    shouldAnimateDragMovement,
    dimension,
    direction,
    draggingOver,
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
      const draggingOver: ?DroppableId = state.drag.impact.destination ?
        state.drag.impact.destination.droppableId :
        null;

      return getDraggingProps(
        memoizedOffset(offset.x, offset.y),
        shouldAnimateDragMovement,
        dimension,
        direction,
        draggingOver,
      );
    }

    // dropping

    const pending: ?PendingDrop = state.drop && state.drop.pending;

    if (!pending) {
      console.error('cannot provide props for dropping item when there is invalid state');
      return null;
    }

    // this was not the dragging item
    if (pending.result.draggableId !== ownProps.draggableId) {
      return null;
    }

    const draggingOver: ?DroppableId = pending.result.destination ?
      pending.result.destination.droppableId : null;
    const direction: ?Direction = pending.impact.direction ?
      pending.impact.direction : null;

    // not memoized as it is the only execution
    return {
      isDragging: false,
      isDropAnimating: true,
      offset: pending.newHomeOffset,
      // still need to provide the dimension for the placeholder
      dimension: state.dimension.draggable[ownProps.draggableId],
      draggingOver,
      direction,
      // animation will be controlled by the isDropAnimating flag
      shouldAnimateDragMovement: false,
      // not relevant,
      shouldAnimateDisplacement: false,
    };
  };

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

      return getOutOfTheWayMovement(ownProps.draggableId, state.drag.impact.movement);
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

    return getOutOfTheWayMovement(ownProps.draggableId, state.drop.pending.impact.movement);
  };

  return createSelector(
    [
      draggingSelector,
      movingOutOfTheWaySelector,
    ],
    (
      dragging: ?MapProps,
      movingOutOfTheWay: ?MapProps,
    ): MapProps => {
      if (dragging) {
        return dragging;
      }

      if (movingOutOfTheWay) {
        return movingOutOfTheWay;
      }

      return defaultMapProps;
    },
  );
};

const makeMapStateToProps = () => {
  const selector: Selector = makeSelector();
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
const ConnectedDraggable: OwnProps => Node = (connect(
  // returning a function to ensure each
  // Draggable gets its own selector
  (makeMapStateToProps: any),
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
