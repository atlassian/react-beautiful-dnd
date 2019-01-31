// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  State,
  DropReason,
  Critical,
  DraggableLocation,
  DragImpact,
  DropResult,
  PendingDrop,
  Combine,
  DimensionMap,
  DraggableDimension,
} from '../../../types';
import type { MiddlewareStore, Dispatch, Action } from '../../store-types';
import { animateDrop, completeDrop, dropPending } from '../../action-creators';
import { isEqual } from '../../position';
import getDropDuration from './get-drop-duration';
import getNewHomeClientOffset from './get-new-home-client-offset';
import getDropImpact from './get-drop-impact';

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

  const impact: DragImpact = getDropImpact({
    reason,
    lastImpact: state.impact,
    onLift: state.onLift,
    onLiftImpact: state.onLiftImpact,
    home: state.dimensions.droppables[state.critical.droppable.id],
    viewport: state.viewport,
    draggables: state.dimensions.draggables,
  });

  console.log('impact', impact);

  const draggable: DraggableDimension =
    dimensions.draggables[state.critical.draggable.id];
  const destination: ?DraggableLocation = impact ? impact.destination : null;
  const combine: ?Combine =
    impact && impact.merge ? impact.merge.combine : null;

  const source: DraggableLocation = {
    index: critical.draggable.index,
    droppableId: critical.droppable.id,
  };

  console.warn('source', source);

  const result: DropResult = {
    draggableId: draggable.descriptor.id,
    type: draggable.descriptor.type,
    source,
    mode: state.movementMode,
    destination,
    combine,
    reason,
  };

  const newHomeClientOffset: Position = getNewHomeClientOffset({
    impact,
    draggable,
    dimensions,
    viewport: state.viewport,
    onLift: state.onLift,
  });

  // Do not animate if you do not need to.
  // Animate the drop if:
  // - not already in the right spot OR
  // - doing a combine (we still want to animate the scale and opacity fade)
  const isAnimationRequired: boolean =
    !isEqual(state.current.client.offset, newHomeClientOffset) ||
    Boolean(result.combine);

  if (!isAnimationRequired) {
    dispatch(completeDrop(result));
    return;
  }

  const dropDuration: number = getDropDuration({
    current: state.current.client.offset,
    destination: newHomeClientOffset,
    reason,
  });

  const pending: PendingDrop = {
    newHomeClientOffset,
    dropDuration,
    result,
    impact,
  };

  dispatch(animateDrop(pending));
};
