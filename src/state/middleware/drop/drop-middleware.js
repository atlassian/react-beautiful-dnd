// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import { dropPending, completeDrop, animateDrop } from '../../action-creators';
import noImpact from '../../no-impact';
import whenCombining from '../../get-new-home-client-border-box-center/when-combining';
import whenReordering from '../../get-new-home-client-border-box-center/when-reordering';
import { add, subtract, isEqual, origin } from '../../position';
import withDroppableDisplacement from '../../with-droppable-displacement';
import getDropDuration from './get-drop-duration';
import type {
  State,
  DropReason,
  DroppableDimension,
  Viewport,
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

const getScrollDisplacement = (
  droppable: DroppableDimension,
  viewport: Viewport,
): Position =>
  withDroppableDisplacement(droppable, viewport.scroll.diff.displacement);

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
  const impact: DragImpact = reason === 'DROP' ? state.impact : noImpact;
  const home: DroppableDimension =
    dimensions.droppables[state.critical.droppable.id];
  const draggable: DraggableDimension =
    dimensions.draggables[state.critical.draggable.id];
  const destination: ?DraggableLocation = impact ? impact.destination : null;
  const droppable: ?DroppableDimension = destination
    ? dimensions.droppables[destination.droppableId]
    : null;
  const combine: ?Combine =
    impact && impact.merge ? impact.merge.combine : null;

  const source: DraggableLocation = {
    index: critical.draggable.index,
    droppableId: critical.droppable.id,
  };

  const result: DropResult = {
    draggableId: draggable.descriptor.id,
    type: home.descriptor.type,
    source,
    mode: state.movementMode,
    destination,
    combine,
    reason,
  };

  const clientOffset: Position = (() => {
    // We are moving back to where we started
    if (reason === 'CANCEL') {
      return origin;
    }

    const newBorderBoxClientCenter: Position =
      whenCombining({
        impact,
        draggables: dimensions.draggables,
      }) ||
      whenReordering({
        impact,
        draggable,
        draggables: dimensions.draggables,
        destination: droppable,
      }) ||
      draggable.client.borderBox.center;

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

  const dropDuration: number = getDropDuration({
    current: state.current.client.offset,
    destination: newHomeOffset,
    reason,
  });

  const pending: PendingDrop = {
    newHomeOffset,
    dropDuration,
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
