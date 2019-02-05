// @flow
import invariant from 'tiny-invariant';
import type {
  DimensionMap,
  DraggingState,
  CollectingState,
  DropPendingState,
  Published,
  Critical,
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
} from '../../types';
import * as timings from '../../debug/timings';
import getDragPositions from './get-drag-positions';
import adjustModifiedDroppables from './adjust-modified-droppables';
import adjustAdditionsForScrollChanges from './adjust-additions-for-scroll-changes';
import getDraggableMap from './get-draggable-map';
import { toDroppableMap } from '../dimension-structures';
import getDimensionMapWithPlaceholder from '../get-dimension-map-with-placeholder';
import getHomeOnLift from '../get-home-on-lift';
import getDragImpact from '../get-drag-impact';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import withNoAnimatedDisplacement from './with-no-animated-displacement';

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
  const adjusted: DroppableDimension[] = adjustModifiedDroppables({
    modified: published.modified,
    existingDroppables: state.dimensions.droppables,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  const shifted: DraggableDimension[] = adjustAdditionsForScrollChanges({
    additions: published.additions,
    // using our already adjusted droppables as they have the correct scroll changes
    modified: adjusted,
    viewport: state.viewport,
  });

  const patched: DimensionMap = {
    draggables: state.dimensions.draggables,
    droppables: {
      ...state.dimensions.droppables,
      ...toDroppableMap(adjusted),
    },
  };

  // Add, remove and shift draggables
  const draggables: DraggableDimensionMap = getDraggableMap({
    existing: patched,
    additions: shifted,
    removals: published.removals,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  const dragging: DraggableId = state.critical.draggable.id;
  const original: DraggableDimension = state.dimensions.draggables[dragging];
  const updated: DraggableDimension = draggables[dragging];

  const dimensions: DimensionMap = getDimensionMapWithPlaceholder({
    previousImpact: state.impact,
    impact: state.impact,
    draggable: updated,
    dimensions: {
      draggables,
      droppables: patched.droppables,
    },
  });

  const critical: Critical = {
    // droppable cannot change during a drag
    droppable: state.critical.droppable,
    // draggable index can change during a drag
    draggable: updated.descriptor,
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
  console.group('new impact');
  console.log('index', impact.destination ? impact.destination.index : null);
  console.log('displaced', impact.movement.displaced.map(d => d.draggableId));
  console.log('onLift', onLift.wasDisplaced);
  console.groupEnd();

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
