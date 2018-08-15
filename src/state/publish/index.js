// @flow
import invariant from 'tiny-invariant';
import type {
  DragImpact,
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
} from '../../types';
import * as timings from '../../debug/timings';
import getDragImpact from '../get-drag-impact';
import getHomeImpact from '../get-home-impact';
import getDragPositions from './get-drag-positions';
import adjustModifiedDroppables from './adjust-modified-droppables';
import adjustAdditionsForScrollChanges from './adjust-additions-for-scroll-changes';
import getDraggableMap from './get-draggable-map';
import withNoAnimatedDisplacement from './with-no-animated-displacement';
import { toDroppableMap } from '../dimension-structures';

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
  const adjusted: DroppableDimension[] = adjustModifiedDroppables({
    modified: published.modified,
    existing: state.dimensions.droppables,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  // TODO: write validate that every removed draggable must have a removed droppable
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

  // Add, remove and shift dimensions
  const draggables: DraggableDimensionMap = getDraggableMap({
    existing: patched,
    additions: shifted,
    removals: published.removals,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  const dimensions: DimensionMap = {
    droppables: patched.droppables,
    draggables,
  };

  const dragging: DraggableId = state.critical.draggable.id;
  const original: DraggableDimension = state.dimensions.draggables[dragging];
  const updated: DraggableDimension = dimensions.draggables[dragging];

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
  const impact: DragImpact = withNoAnimatedDisplacement(
    getDragImpact({
      pageBorderBoxCenter: current.page.borderBoxCenter,
      draggable: dimensions.draggables[state.critical.draggable.id],
      draggables: dimensions.draggables,
      droppables: dimensions.droppables,
      previousImpact: getHomeImpact(state.critical, dimensions),
      viewport: state.viewport,
      direction: state.direction,
    }),
  );

  const isOrphaned: boolean = Boolean(
    state.autoScrollMode === 'JUMP' &&
      state.impact.destination &&
      !impact.destination,
  );

  // TODO: try and recover?
  invariant(
    !isOrphaned,
    'Dragging item no longer has a valid destination after a dynamic update. This is not supported',
  );

  // TODO: move into move visually pleasing position if using
  // JUMP auto scrolling

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
    // not animating this movement
    shouldAnimate: false,
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
