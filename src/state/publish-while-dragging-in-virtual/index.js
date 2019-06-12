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
  DraggableDimensionMap,
  DroppableDimension,
  DragImpact,
} from '../../types';
import * as timings from '../../debug/timings';
import getDragImpact from '../get-drag-impact';
import adjustAdditionsForScrollChanges from '../publish-while-dragging/update-draggables/adjust-additions-for-scroll-changes';
import { toDraggableMap, toDraggableList } from '../dimension-structures';
import getLiftEffect from '../get-lift-effect';

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

  // Rules:

  // - do not remove old dimensions (WE SHOULD! to speed up list lookups)
  // - do not add a new dimension if we already have it
  // - shift any added dimension to account for change scroll

  const updated: DraggableDimension[] = adjustAdditionsForScrollChanges({
    additions: published.additions,
    updatedDroppables: state.dimensions.droppables,
    viewport: state.viewport,
  });

  const draggables: DraggableDimensionMap = {
    ...state.dimensions.draggables,
    ...toDraggableMap(updated),
  };

  // remove all the old ones (except for the critical)
  // we do this so that list operations remain fast
  // TODO: need to test the impact of this like crazy
  published.removals.forEach((id: DraggableId) => {
    delete draggables[id];
  });

  const dimensions: DimensionMap = {
    droppables: state.dimensions.droppables,
    draggables,
  };

  const draggable: DraggableDimension =
    dimensions.draggables[state.critical.draggable.id];
  const home: DroppableDimension =
    dimensions.droppables[state.critical.droppable.id];

  const { impact: onLiftImpact, afterCritical } = getLiftEffect({
    draggable,
    home,
    draggables,
    viewport: state.viewport,
  });

  const impact: DragImpact = getDragImpact({
    pageBorderBoxCenter: state.current.page.borderBoxCenter,
    draggable: dimensions.draggables[state.critical.draggable.id],
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
    // starting from a fresh slate
    previousImpact: state.impact,
    viewport: state.viewport,
    userDirection: state.userDirection,
    afterCritical,
  });

  timings.finish(timingsKey);

  const draggingState: DraggingState = {
    // appeasing flow
    phase: 'DRAGGING',
    ...state,
    // eslint-disable-next-line
    phase: 'DRAGGING',
    impact,
    onLiftImpact,
    dimensions,
    afterCritical,
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
