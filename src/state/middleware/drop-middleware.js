// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import {
  dropPending,
  completeDrop,
  clean,
  animateDrop,
} from '../action-creators';
import noImpact from '../no-impact';
import getNewHomeClientBorderBoxCenter from '../get-new-home-client-border-box-center';
import { add, subtract, isEqual } from '../position';
import withDroppableDisplacement from '../with-droppable-displacement';
import type {
  Store,
  State,
  Action,
  DropReason,
  DroppableDimension,
  WindowDetails,
  Critical,
  DraggableLocation,
  DragImpact,
  DropResult,
  PendingDrop,
  DimensionMap,
  DraggableDimension,
} from '../../types';

const origin: Position = { x: 0, y: 0 };

const getScrollDisplacement = (
  droppable: DroppableDimension,
  windowDetails: WindowDetails,
): Position => withDroppableDisplacement(
  droppable,
  windowDetails.scroll.diff.displacement
);

export default ({ getState, dispatch }: Store) =>
  (next: (Action) => mixed) => (action: Action): mixed => {
  // TODO: pending drop flushing
    if (action.type !== 'DROP') {
      next(action);
      return;
    }

    const state: State = getState();
    invariant(state.phase === 'DRAGGING' || state.phase === 'BULK_COLLECTING',
      `Cannot drop in phase: ${state.phase}`);

    // Still waiting for a bulk collection to publish
    if (state.phase === 'BULK_COLLECTING') {
      dispatch(dropPending());
      return;
    }

    // Was dragging
    const reason: DropReason = action.payload.reason;
    const critical: Critical = state.critical;
    const dimensions: DimensionMap = state.dimensions;
    const impact: DragImpact = reason === 'DROP' ? state.impact : noImpact;
    const home: DroppableDimension = dimensions.droppables[state.critical.droppable.id];
    const draggable: DraggableDimension = dimensions.draggables[state.critical.draggable.id];
    const droppable: ?DroppableDimension = impact && impact.destination ?
      dimensions.droppables[impact.destination.droppableId] : null;

    const source: DraggableLocation = {
      index: critical.draggable.index,
      droppableId: critical.droppable.id,
    };
    const destination: ?DraggableLocation = reason === 'DROP' ? impact.destination : null;

    const result: DropResult = {
      draggableId: draggable.descriptor.id,
      type: home.descriptor.type,
      source,
      destination,
      reason,
    };

    const clientOffset: Position = (() => {
      // We are moving back to where we started
      if (reason === 'CANCEL') {
        return origin;
      }

      const newBorderBoxCenter: Position = getNewHomeClientBorderBoxCenter({
        movement: impact.movement,
        draggable,
        draggables: dimensions.draggables,
        destination: droppable,
      });

      // What would the offset be from our original center?
      return subtract(newBorderBoxCenter, draggable.client.borderBox.center);
    })();

    const newHomeOffset: Position = add(
      clientOffset,
      getScrollDisplacement(droppable || home, state.window)
    );

    // Do not animate if you do not need to.
    // This will be the case if either you are dragging with a
    // keyboard or if you manage to nail it just with a mouse.
    const isAnimationRequired = !isEqual(
      state.current.client.offset,
      newHomeOffset,
    );

    const pending: PendingDrop = {
      newHomeOffset,
      result,
      impact,
    };

    if (isAnimationRequired) {
      dispatch(animateDrop(pending));
      return;
    }

    dispatch(completeDrop(result));
    dispatch(clean());
  };

