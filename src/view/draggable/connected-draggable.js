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

export const makeSelector = (): Selector => {
  const idSelector = (state: State, ownProps: OwnProps): DraggableId => ownProps.draggableId;

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

  const getNotDraggingProps = memoizeOne(
    (draggableId: DraggableId,
      movement: DragMovement,
      canLift: boolean,
    ): MapProps => {
      // return defaultMapProps;

      const needsToMove = movement.draggables.indexOf(draggableId) !== -1;

      if (!needsToMove) {
        return getWithMovement(
          origin,
          canLift
        );
      }

      const amount: Position = movement.isBeyondStartPosition ?
        negate(movement.amount) :
        movement.amount;

      return getWithMovement(
        memoizedOffset(amount.x, amount.y),
        canLift,
      );
    },
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

  // TODO: return null if not dragging?
  const ownDimensionSelector = (state: State, ownProps: OwnProps): ?DraggableDimension => {
    if (!state.dimension) {
      return null;
    }
    const dimension: ?DraggableDimension = state.dimension.draggable[ownProps.draggableId];

    // dimension might not be published yet
    if (!dimension) {
      return null;
    }

    return dimension;
  };

  return createSelector(
    [
      idSelector,
      phaseSelector,
      dragSelector,
      pendingDropSelector,
      ownDimensionSelector,
    ],
    (id: DraggableId,
      phase: Phase,
      drag: ?DragState,
      pending: ?PendingDrop,
      ownDimension: ?DraggableDimension,
    ): MapProps => {
      // may not have the correct type OR has not been collected.
      // either way this item will not be moving
      if (!ownDimension) {
        return defaultMapProps;
      }

      if (phase === 'DRAGGING') {
        if (!drag) {
          console.error('invalid dragging state');
          return defaultMapProps;
        }

        const current: CurrentDrag = drag.current;
        const descriptor: DraggableDescriptor = drag.initial.descriptor;
        const impact: DragImpact = drag.impact;

        if (descriptor.id !== id) {
          return getNotDraggingProps(
            id,
            impact.movement,
            // disallowing lifting while dragging something else
            false,
          );
        }

        // this item is dragging
        const offset: Position = current.client.offset;
        const canAnimate: boolean = current.shouldAnimate;

        return getDraggingProps(
          memoizedOffset(offset.x, offset.y),
          canAnimate,
          ownDimension,
          impact.direction,
        );
      }

      if (phase === 'DROP_ANIMATING') {
        if (!pending) {
          console.error('cannot animate drop without a pending drop');
          return defaultMapProps;
        }

        if (pending.result.draggableId !== id) {
          // This flag is a matter of degree.
          // When dropping chances are Draggables have already mostly moved to where
          // they need to be. When cancelling, Draggables still have to travel
          // to their original position. If the user clicks on one while returning
          // home then the original scroll position will be off

          // We want to enable dragging as quickly as possible

          // Ideally the drag-handle would be intelligent enough to remove any
          // temporary animating offset from its initial position
          const canLift = pending.trigger === 'DROP';

          return getNotDraggingProps(
            id,
            pending.impact.movement,
            canLift,
          );
        }

        return {
          isDragging: false,
          isDropAnimating: true,
          canAnimate: true,
          offset: pending.newHomeOffset,
          // cannot lift something that is dropping
          canLift: false,
          // still need to provide the dimension for the placeholder
          dimension: ownDimension,
          // direction no longer needed as drag handle is unbound
          direction: null,
        };
      }

      // All unhandled phases
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

