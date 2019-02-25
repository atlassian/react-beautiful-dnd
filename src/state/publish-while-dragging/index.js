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
  DroppableDimensionMap,
  DragImpact,
} from '../../types';
import * as timings from '../../debug/timings';
import getDragPositions from './get-drag-positions';
import adjustAdditionsForScrollChanges from './update-draggables/adjust-additions-for-scroll-changes';
import getDraggableMap from './update-draggables/adjust-existing-for-additions-and-removals';
import { toDroppableMap } from '../dimension-structures';
import getDimensionMapWithPlaceholder from '../get-dimension-map-with-placeholder';
import getHomeOnLift from '../get-home-on-lift';
import getDragImpact from '../get-drag-impact';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import withNoAnimatedDisplacement from './with-no-animated-displacement';
import adjustAdditionsForCollapsedHome from './adjust-additions-for-collapsed-home';
import adjustExistingForAdditionsAndRemovals from './update-draggables/adjust-existing-for-additions-and-removals';
import updateDroppables from './update-droppables';

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
  const droppables: DroppableDimensionMap = updateDroppables({
    modified: published.modified,
    existing: state.dimensions.droppables,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  const draggables: DraggableDimensionMap = updateDraggables({
    droppables,
    existing: state.dimensions.draggables,
    additions: published.additions,
    removals: published.removals,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  // Adjust the existing draggables

  const shiftedExistingDraggables: DraggableDimensionMap = adjustExistingForAdditionsAndRemovals(
    {
      droppables,
      additions: withScrollChanges,
    },
  );

  const dragging: DraggableDimension =
    shiftedExistingDraggables[state.critical.draggable.id];
  const home: DroppableDimension = droppables[state.critical.droppable.id];

  const critical: Critical = {
    // droppable cannot change during a drag
    droppable: home.descriptor,
    // draggable index can change during a drag
    draggable: dragging.descriptor,
  };

  // Adjust the added draggables

  const scrolledAdditions: DraggableDimension[] = adjustAdditionsForScrollChanges(
    {
      additions: published.additions,
      // using our already adjusted droppables as they have the correct scroll changes
      modified: adjustedDroppables,
      viewport: state.viewport,
    },
  );

  const shiftedAdditions: DraggableDimension[] = adjustAdditionsForCollapsedHome(
    {
      additions: scrolledAdditions,
      dragging: updated,
      // T OPDO
      home: adjustedDroppables[critical.droppable.id],
      viewport: state.viewport,
    },
  );

  const patched: DimensionMap = {
    draggables: state.dimensions.draggables,
    droppables: {
      ...state.dimensions.droppables,
      ...toDroppableMap(adjusted),
    },
  };

  // Add, remove and shift draggables
  // const draggables: DraggableDimensionMap = getDraggableMap({
  //   existing: patched,
  //   additions: shifted,
  //   removals: published.removals,
  //   initialWindowScroll: state.viewport.scroll.initial,
  // });

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
