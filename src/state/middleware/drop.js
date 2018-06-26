// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import {
  dropPending,
  completeDrop,
  animateDrop,
  clean,
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
  Viewport,
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
  viewport: Viewport,
): Position =>
  withDroppableDisplacement(droppable, viewport.scroll.diff.displacement);

export default ({ getState, dispatch }: Store) => (next: Action => mixed) => (
  action: Action,
): mixed => {
  if (action.type !== 'DROP') {
    next(action);
    return;
  }

  const state: State = getState();
  const reason: DropReason = action.payload.reason;

  // Still waiting for a bulk collection to publish
  // We are now shifting the application into the 'DROP_PENDING' phase
  if (state.phase === 'COLLECTING') {
    dispatch(dropPending({ reason }));
    return;
  }

  // Drag ended before preparing phase had finished
  // No hooks have been called at this point
  if (state.phase === 'PREPARING') {
    dispatch(clean());
    return;
  }

  // Still waiting for our drop pending to end
  // TODO: should this throw?
  const isWaitingForDrop: boolean =
    state.phase === 'DROP_PENDING' && state.isWaiting;
  invariant(
    !isWaitingForDrop,
    'A DROP action occurred while DROP_PENDING and still waiting',
  );

  invariant(
    state.phase === 'DRAGGING' || state.phase === 'DROP_PENDING',
    `Cannot drop in phase: ${state.phase}`,
  );
  // We are now in the DRAGGING or DROP_PENDING phase

  const critical: Critical = state.critical;
  const dimensions: DimensionMap = state.dimensions;
  const impact: DragImpact = reason === 'DROP' ? state.impact : noImpact;
  const home: DroppableDimension =
    dimensions.droppables[state.critical.droppable.id];
  const draggable: DraggableDimension =
    dimensions.draggables[state.critical.draggable.id];
  const droppable: ?DroppableDimension =
    impact && impact.destination
      ? dimensions.droppables[impact.destination.droppableId]
      : null;

  const source: DraggableLocation = {
    index: critical.draggable.index,
    droppableId: critical.droppable.id,
  };
  const destination: ?DraggableLocation =
    reason === 'DROP' ? impact.destination : null;

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

    const newBorderBoxClientCenter: Position = getNewHomeClientBorderBoxCenter({
      movement: impact.movement,
      draggable,
      draggables: dimensions.draggables,
      destination: droppable,
    });

    // What would the offset be from our original center?
    return subtract(
      newBorderBoxClientCenter,
      draggable.client.borderBox.center,
    );
  })();

  const newHomeOffset: Position = add(
    clientOffset,
    // If cancelling: consider the home droppable
    // If dropping over nothing: consider the home droppable
    // If dropping over a droppable: consider the scroll of the droppable you are over
    getScrollDisplacement(droppable || home, state.viewport),
  );

  // Do not animate if you do not need to.
  // This will be the case if either you are dragging with a
  // keyboard or if you manage to nail it with a mouse / touch.
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
    // will be completed by the drop-animation-finish middleware
    dispatch(animateDrop(pending));
    return;
  }

  dispatch(completeDrop(result));
};
