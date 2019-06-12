// @flow
import invariant from 'tiny-invariant';
import type {
  DimensionMap,
  DraggingState,
  CollectingState,
  DropPendingState,
  Published,
  Critical,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DragImpact,
} from '../../types';
import * as timings from '../../debug/timings';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import getDragImpact from '../get-drag-impact';
import getLiftEffects from '../get-lift-effects';
import getDragPositions from './get-drag-positions';
import updateDraggables from './update-draggables';
import updateDroppables from './update-droppables';
import withNoAnimatedDisplacement from './with-no-animated-displacement';
import recomputePlaceholders from '../recompute-placeholders';

type Args = {|
  state: CollectingState | DropPendingState,
  published: Published,
|};

const timingsKey: string = 'Processing dynamic changes';

export default ({
  state,
  published,
}: Args): DraggingState | DropPendingState => {
  timings.start(timingsKey);

  // Change the subject size and scroll of droppables
  // will remove any subject.withPlaceholder
  const updatedDroppables: DroppableDimensionMap = updateDroppables({
    modified: published.modified,
    existing: state.dimensions.droppables,
    viewport: state.viewport,
  });

  const draggables: DraggableDimensionMap = updateDraggables({
    updatedDroppables,
    // will not change during a drag
    criticalId: state.critical.draggable.id,
    existing: state.dimensions.draggables,
    additions: published.additions,
    removals: published.removals,
    viewport: state.viewport,
  });

  const critical: Critical = {
    draggable: draggables[state.critical.draggable.id].descriptor,
    droppable: updatedDroppables[state.critical.droppable.id].descriptor,
  };
  const original: DraggableDimension =
    state.dimensions.draggables[critical.draggable.id];
  const updated: DraggableDimension = draggables[critical.draggable.id];

  // TODO: this is a bit of a chicken and egg problem, but it will use the old impact for placeholders
  const droppables: DroppableDimensionMap = recomputePlaceholders({
    draggable: updated,
    draggables,
    droppables: updatedDroppables,
    previousImpact: state.impact,
    impact: state.impact,
  });

  const dimensions: DimensionMap = {
    draggables,
    droppables,
  };

  // Get the updated drag positions to account for any
  // shift to the critical draggable
  const { initial, current } = getDragPositions({
    initial: state.initial,
    current: state.current,
    oldClientBorderBoxCenter: original.client.borderBox.center,
    newClientBorderBoxCenter: updated.client.borderBox.center,
    viewport: state.viewport,
  });

  // Get the impact of all of our changes
  // this could result in a strange snap placement (will be fixed on next move)
  const { impact: homeImpact, onLift } = getHomeOnLift({
    draggable: updated,
    home: dimensions.droppables[critical.droppable.id],
    draggables: dimensions.draggables,
    viewport: state.viewport,
  });
  // now need to calculate the impact for the current pageBorderBoxCenter
  const impact: DragImpact = withNoAnimatedDisplacement(
    getDragImpact({
      pageBorderBoxCenter: current.page.borderBoxCenter,
      draggable: updated,
      draggables: dimensions.draggables,
      droppables: dimensions.droppables,
      // starting from a fresh slate
      previousImpact: homeImpact,
      viewport: state.viewport,
      userDirection: state.userDirection,
      onLift,
    }),
  );

  const isOrphaned: boolean = Boolean(
    state.movementMode === 'SNAP' && !whatIsDraggedOver(impact),
  );

  // TODO: try and recover?
  invariant(
    !isOrphaned,
    'Dragging item no longer has a valid merge/destination after a dynamic update. This is not supported',
  );

  // TODO: move into move visually pleasing position if using JUMP auto scrolling

  timings.finish(timingsKey);

  const draggingState: DraggingState = {
    // appeasing flow
    phase: 'DRAGGING',
    ...state,
    // eslint-disable-next-line
    phase: 'DRAGGING',
    critical,
    current,
    initial,
    impact,
    dimensions,
    onLift,
    onLiftImpact: homeImpact,
    // not animating this movement
    forceShouldAnimate: false,
  };

  if (state.phase === 'COLLECTING') {
    return draggingState;
  }

  // There was a DROP_PENDING
  // Staying in the DROP_PENDING phase
  // setting isWaiting for false

  const dropPending: DropPendingState = {
    // appeasing flow
    phase: 'DROP_PENDING',
    ...draggingState,
    // eslint-disable-next-line
    phase: 'DROP_PENDING',
    // No longer waiting
    reason: state.reason,
    isWaiting: false,
  };

  return dropPending;
};
