// @flow
import type {
  DimensionMap,
  DraggingState,
  CollectingState,
  DropPendingState,
  Published,
  Critical,
  Scrollable,
  DraggableId,
  DraggableDimension,
  DroppableDimensionMap,
  DraggableDimensionMap,
  DroppableDimension,
  DragImpact,
} from '../../types';
import * as timings from '../../debug/timings';
import getDragImpact from '../get-drag-impact';
import adjustAdditionsForScrollChanges from '../publish-while-dragging/update-draggables/adjust-additions-for-scroll-changes';
import {
  toDraggableMap,
  toDraggableList,
  toDroppableMap,
} from '../dimension-structures';
import getLiftEffect from '../get-lift-effect';
import scrollDroppable from '../droppable/scroll-droppable';

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

  // TODO: update window scroll (needs to be a part of the published object)

  // The scroll might be different to what is currently in the state
  // We want to ensure the new draggables are in step with the state
  const withScrollChange: DroppableDimension[] = published.modified.map(
    (droppable: DroppableDimension): DroppableDimension => {
      const existing: DroppableDimension =
        state.dimensions.droppables[droppable.descriptor.id];

      // TODO: need to ensure collector is okay with collecting from non-scroll containers
      // TODO: collector should be updated to simply return a list of current scroll positions
      const frame: ?Scrollable = existing.frame;
      if (!frame) {
        return droppable;
      }
      const scrolled: DroppableDimension = scrollDroppable(
        existing,
        frame.scroll.current,
      );
      return scrolled;
    },
  );

  const droppables: DroppableDimensionMap = {
    ...state.dimensions.droppables,
    ...toDroppableMap(withScrollChange),
  };

  const updated: DraggableDimension[] = adjustAdditionsForScrollChanges({
    additions: published.additions,
    updatedDroppables: droppables,
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
    droppables,
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
