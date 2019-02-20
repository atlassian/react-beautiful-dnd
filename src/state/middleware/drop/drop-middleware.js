// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  State,
  DropReason,
  Critical,
  DraggableLocation,
  DropResult,
  CompletedDrag,
  Combine,
  DimensionMap,
  DraggableDimension,
} from '../../../types';
import type { MiddlewareStore, Dispatch, Action } from '../../store-types';
import {
  animateDrop,
  completeDrop,
  dropPending,
  type AnimateDropArgs,
} from '../../action-creators';
import { isEqual } from '../../position';
import getDropDuration from './get-drop-duration';
import getNewHomeClientOffset from './get-new-home-client-offset';
import getDropImpact, { type Result } from './get-drop-impact';

export default ({ getState, dispatch }: MiddlewareStore) => (
  next: Dispatch,
) => (action: Action): any => {
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

  // Could have occurred in response to an error
  if (state.phase === 'IDLE') {
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
  // Only keeping impact when doing a user drop - otherwise we are cancelling

  const { impact, didDropInsideDroppable }: Result = getDropImpact({
    reason,
    lastImpact: state.impact,
    onLift: state.onLift,
    onLiftImpact: state.onLiftImpact,
    home: state.dimensions.droppables[state.critical.droppable.id],
    viewport: state.viewport,
    draggables: state.dimensions.draggables,
  });

  const draggable: DraggableDimension =
    dimensions.draggables[state.critical.draggable.id];

  // only populating destination / combine if 'didDropInsideDroppable' is true
  const destination: ?DraggableLocation =
    didDropInsideDroppable && impact ? impact.destination : null;
  const combine: ?Combine =
    didDropInsideDroppable && impact && impact.merge
      ? impact.merge.combine
      : null;

  const source: DraggableLocation = {
    index: critical.draggable.index,
    droppableId: critical.droppable.id,
  };

  const result: DropResult = {
    draggableId: draggable.descriptor.id,
    type: draggable.descriptor.type,
    source,
    reason,
    mode: state.movementMode,
    // destination / combine will be null if didDropInsideDroppable is true
    destination,
    combine,
  };

  const newHomeClientOffset: Position = getNewHomeClientOffset({
    impact,
    draggable,
    dimensions,
    viewport: state.viewport,
    onLift: state.onLift,
  });

  const completed: CompletedDrag = {
    critical: state.critical,
    result,
    impact,
  };

  // Do not animate if you do not need to.
  // Animate the drop if:
  // - not already in the right spot OR
  // - doing a combine (we still want to animate the scale and opacity fade)
  // TODO: what about the placeholder that needs to animate??
  const isAnimationRequired: boolean =
    !isEqual(state.current.client.offset, newHomeClientOffset) ||
    Boolean(result.combine);

  if (!isAnimationRequired) {
    dispatch(completeDrop({ completed, shouldFlush: false }));
    return;
  }

  const dropDuration: number = getDropDuration({
    current: state.current.client.offset,
    destination: newHomeClientOffset,
    reason,
  });

  const args: AnimateDropArgs = {
    newHomeClientOffset,
    dropDuration,
    completed,
  };

  dispatch(animateDrop(args));
};
