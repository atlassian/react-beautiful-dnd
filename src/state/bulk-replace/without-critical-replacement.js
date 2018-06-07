// @flow
import getDragImpact from '../get-drag-impact';
import type {
  BulkCollectionState,
  DropPendingState,
  DraggingState,
  DraggableDimension,
  DroppableDimension,
  DimensionMap,
  Viewport,
  DragImpact,
} from '../../types';
import type { Result } from './bulk-replace-types';

type Args = {|
  state: BulkCollectionState | DropPendingState,
  viewport: Viewport,
  dimensions: DimensionMap,
|}

export default ({
  state,
  viewport,
  dimensions: suppliedDimensions,
}: Args): Result => {
  // need to maintain critical dimensions as they where not collected
  const draggable: DraggableDimension =
    state.dimensions.draggables[state.critical.draggable.id];
  const droppable: DroppableDimension =
    state.dimensions.droppables[state.critical.droppable.id];

  const dimensions: DimensionMap = {
    draggables: {
      ...suppliedDimensions.draggables,
      [draggable.descriptor.id]: draggable,
    },
    droppables: {
      ...suppliedDimensions.droppables,
      [droppable.descriptor.id]: droppable,
    },
  };

  const impact: DragImpact = getDragImpact({
    pageBorderBoxCenter: state.current.page.borderBoxCenter,
    draggable: dimensions.draggables[state.critical.draggable.id],
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
    previousImpact: state.impact,
    viewport,
  });

  const draggingState: DraggingState = {
  // appeasing flow
    phase: 'DRAGGING',
    ...state,
    // eslint-disable-next-line
    phase: 'DRAGGING',
    impact,
    viewport,
    dimensions,
  };

  if (state.phase === 'BULK_COLLECTING') {
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
