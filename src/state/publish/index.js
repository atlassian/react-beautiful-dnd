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
  DroppableDimensionMap,
  DraggableDimensionMap,
} from '../../types';
import * as timings from '../../debug/timings';
import getDragImpact from '../get-drag-impact';
import getHomeImpact from '../get-home-impact';
import getDragPositions from './get-drag-positions';
import changeDroppableSubjectSize from './change-droppable-subject-size';
import adjustAdditionsForScrollChanges from './adjust-additions-for-scroll-changes';
import getDraggableMap from './get-draggable-map';

type Args = {|
  state: CollectingState | DropPendingState,
  published: Published,
|};

const timingsKey: string = 'Massaging dynamic changes';

export default ({
  state,
  published,
}: Args): DraggingState | DropPendingState => {
  timings.start(timingsKey);
  // TODO: write validate that every removed draggable must have a removed droppable
  const withShifted: Published = adjustAdditionsForScrollChanges({
    published,
    droppables: state.dimensions.droppables,
    viewport: state.viewport,
  });

  // Change the client size of modified droppables
  const droppables: DroppableDimensionMap = changeDroppableSubjectSize({
    droppables: state.dimensions.droppables,
    modified: published.modified,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  const patched: DimensionMap = {
    draggables: state.dimensions.draggables,
    droppables,
  };

  // Add, remove and shift dimensions
  const draggables: DraggableDimensionMap = getDraggableMap({
    existing: patched,
    published: withShifted,
    initialWindowScroll: state.viewport.scroll.initial,
  });

  const dimensions: DimensionMap = {
    droppables,
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
  const impact: DragImpact = getDragImpact({
    pageBorderBoxCenter: current.page.borderBoxCenter,
    draggable: dimensions.draggables[state.critical.draggable.id],
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
    previousImpact: getHomeImpact(state.critical, dimensions),
    viewport: state.viewport,
  });

  const isOrphaned: boolean = Boolean(
    state.autoScrollMode === 'JUMP' &&
      state.impact.destination &&
      !impact.destination,
  );

  invariant(
    !isOrphaned,
    'Dragging item no longer has a valid destination after a dynamic update. This is not supported',
  );

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
